import { NextRequest } from "next/server";
import {
  getAuthContext,
  isErrorResponse,
  jsonError,
  jsonSuccess,
} from "@/lib/api-utils";

type Period = "month" | "quarter" | "year";
type ReportType =
  | "vendor-performance"
  | "origin-conversion"
  | "loss-reasons"
  | "stage-conversion"
  | "revenue-period"
  | "response-time"
  | "team-performance"
  | "activities"
  | "revenue-forecast";

const MONTH_LABELS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

function getPeriodStart(period: Period): Date {
  const now = new Date();
  switch (period) {
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case "quarter": {
      const q = Math.floor(now.getMonth() / 3) * 3;
      return new Date(now.getFullYear(), q, 1);
    }
    case "year":
      return new Date(now.getFullYear(), 0, 1);
    default:
      return new Date(now.getFullYear(), now.getMonth(), 1);
  }
}

export async function GET(req: NextRequest) {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type") as ReportType | null;
  const period = (searchParams.get("period") || "month") as Period;

  if (!type) {
    return jsonError("Query param 'type' é obrigatório", 400);
  }

  const orgId = auth.organizationId;
  const periodStart = getPeriodStart(period).toISOString();

  // ── Fetch pipeline stages (needed by most reports) ──
  const { data: pipelines } = await auth.supabase
    .from("pipelines")
    .select("id, pipeline_stages(id, name, \"order\")")
    .eq("organization_id", orgId);

  const wonStageIds: string[] = [];
  const lostStageIds: string[] = [];
  const allStages: { id: string; name: string; order: number }[] = [];

  if (pipelines) {
    for (const p of pipelines) {
      const stages = (p.pipeline_stages as { id: string; name: string; order: number }[]) || [];
      for (const s of stages) {
        allStages.push(s);
        if (s.name === "Fechado Ganho") wonStageIds.push(s.id);
        if (s.name === "Fechado Perdido") lostStageIds.push(s.id);
      }
    }
  }

  switch (type) {
    case "vendor-performance":
      return await vendorPerformance(auth, orgId, periodStart, wonStageIds, lostStageIds);
    case "origin-conversion":
      return await originConversion(auth, orgId, periodStart, wonStageIds);
    case "loss-reasons":
      return await lossReasons(auth, orgId, periodStart, lostStageIds);
    case "stage-conversion":
      return await stageConversion(auth, orgId, allStages, wonStageIds, lostStageIds);
    case "revenue-period":
      return await revenuePeriod(auth, orgId, wonStageIds);
    case "response-time":
      return responseTime();
    case "team-performance":
      return await teamPerformance(auth, orgId, periodStart, wonStageIds, lostStageIds);
    case "activities":
      return await activitiesReport(auth, orgId, periodStart);
    case "revenue-forecast":
      return await revenueForecast(auth, orgId, wonStageIds, allStages, lostStageIds);
    default:
      return jsonError("Tipo de relatório inválido", 400);
  }
}

// ─── Vendor Performance ──────────────────────────────────────

async function vendorPerformance(
  auth: { supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createServerClient>> },
  orgId: string,
  periodStart: string,
  wonStageIds: string[],
  lostStageIds: string[],
) {
  const closedIds = [...wonStageIds, ...lostStageIds];

  // Get all deals in period with assigned user
  const { data: deals } = await auth.supabase
    .from("deals")
    .select("id, value, stage_id, assigned_to_id, closed_at")
    .eq("organization_id", orgId)
    .in("stage_id", closedIds.length > 0 ? closedIds : ["__none__"])
    .gte("closed_at", periodStart);

  // Get users in org
  const { data: users } = await auth.supabase
    .from("users")
    .select("id, name")
    .eq("organization_id", orgId);

  const userMap = new Map((users || []).map((u) => [u.id, u.name]));

  // Aggregate by vendor
  const vendorStats: Record<string, { name: string; won: number; lost: number; revenue: number }> = {};

  for (const deal of deals || []) {
    const vendorId = deal.assigned_to_id;
    if (!vendorId) continue;

    if (!vendorStats[vendorId]) {
      vendorStats[vendorId] = {
        name: userMap.get(vendorId) || "Sem nome",
        won: 0,
        lost: 0,
        revenue: 0,
      };
    }

    if (wonStageIds.includes(deal.stage_id)) {
      vendorStats[vendorId].won++;
      vendorStats[vendorId].revenue += parseFloat(deal.value || "0");
    } else if (lostStageIds.includes(deal.stage_id)) {
      vendorStats[vendorId].lost++;
    }
  }

  const rows = Object.values(vendorStats)
    .map((v) => ({
      ...v,
      total: v.won + v.lost,
      conversao: v.won + v.lost > 0 ? Math.round((v.won / (v.won + v.lost)) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  return jsonSuccess({ type: "vendor-performance", data: rows });
}

// ─── Origin Conversion ───────────────────────────────────────

async function originConversion(
  auth: { supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createServerClient>> },
  orgId: string,
  periodStart: string,
  wonStageIds: string[],
) {
  // Get contacts with origin
  const { data: contacts } = await auth.supabase
    .from("contacts")
    .select("id, origin")
    .eq("organization_id", orgId)
    .gte("created_at", periodStart);

  // Get deals that are won, with contact_id
  const { data: wonDeals } = await auth.supabase
    .from("deals")
    .select("id, value, contact_id")
    .eq("organization_id", orgId)
    .in("stage_id", wonStageIds.length > 0 ? wonStageIds : ["__none__"]);

  const wonByContact = new Map<string, number>();
  for (const d of wonDeals || []) {
    if (d.contact_id) {
      wonByContact.set(d.contact_id, (wonByContact.get(d.contact_id) || 0) + parseFloat(d.value || "0"));
    }
  }

  // Aggregate by origin
  const originStats: Record<string, { leads: number; conversoes: number; receita: number }> = {};

  for (const c of contacts || []) {
    const origin = c.origin || "Não informado";
    if (!originStats[origin]) {
      originStats[origin] = { leads: 0, conversoes: 0, receita: 0 };
    }
    originStats[origin].leads++;
    const revenue = wonByContact.get(c.id);
    if (revenue !== undefined) {
      originStats[origin].conversoes++;
      originStats[origin].receita += revenue;
    }
  }

  const COLORS = ["#F97316", "#FB923C", "#FDBA74", "#10B981", "#A3A3A3", "#3B82F6", "#8B5CF6"];
  const rows = Object.entries(originStats)
    .map(([name, stats], i) => ({
      name,
      ...stats,
      taxa: stats.leads > 0 ? Math.round((stats.conversoes / stats.leads) * 1000) / 10 : 0,
      fill: COLORS[i % COLORS.length],
    }))
    .sort((a, b) => b.leads - a.leads);

  return jsonSuccess({ type: "origin-conversion", data: rows });
}

// ─── Loss Reasons ────────────────────────────────────────────

async function lossReasons(
  auth: { supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createServerClient>> },
  orgId: string,
  periodStart: string,
  lostStageIds: string[],
) {
  const { data: lostDeals } = await auth.supabase
    .from("deals")
    .select("loss_reason")
    .eq("organization_id", orgId)
    .in("stage_id", lostStageIds.length > 0 ? lostStageIds : ["__none__"])
    .gte("closed_at", periodStart);

  const reasonCounts: Record<string, number> = {};
  let total = 0;

  for (const deal of lostDeals || []) {
    const reason = deal.loss_reason || "Não informado";
    reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    total++;
  }

  const COLORS = ["#F97316", "#FB923C", "#FDBA74", "#EF4444", "#A3A3A3"];
  const rows = Object.entries(reasonCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count], i) => ({
      name,
      count,
      percentual: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
      fill: COLORS[i % COLORS.length],
    }));

  return jsonSuccess({ type: "loss-reasons", data: rows, total });
}

// ─── Stage Conversion ────────────────────────────────────────

async function stageConversion(
  auth: { supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createServerClient>> },
  orgId: string,
  allStages: { id: string; name: string; order: number }[],
  wonStageIds: string[],
  lostStageIds: string[],
) {
  const closedIds = [...wonStageIds, ...lostStageIds];

  // Get all deals with stage
  const { data: deals } = await auth.supabase
    .from("deals")
    .select("stage_id")
    .eq("organization_id", orgId);

  const stageCounts: Record<string, number> = {};
  for (const d of deals || []) {
    stageCounts[d.stage_id] = (stageCounts[d.stage_id] || 0) + 1;
  }

  // Build funnel - active stages only
  const activeStages = allStages
    .filter((s) => !closedIds.includes(s.id))
    .sort((a, b) => a.order - b.order);

  const rows = activeStages.map((s, i) => {
    const total = stageCounts[s.id] || 0;
    const nextTotal = i < activeStages.length - 1 ? (stageCounts[activeStages[i + 1].id] || 0) : null;
    return {
      stage: s.name,
      total,
      convertidos: nextTotal !== null ? nextTotal : total,
      taxa: nextTotal !== null && total > 0
        ? Math.round((nextTotal / total) * 1000) / 10
        : 100,
    };
  });

  return jsonSuccess({ type: "stage-conversion", data: rows });
}

// ─── Revenue Period ──────────────────────────────────────────

async function revenuePeriod(
  auth: { supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createServerClient>> },
  orgId: string,
  wonStageIds: string[],
) {
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const { data: wonDeals } = await auth.supabase
    .from("deals")
    .select("value, closed_at")
    .eq("organization_id", orgId)
    .in("stage_id", wonStageIds.length > 0 ? wonStageIds : ["__none__"])
    .gte("closed_at", twelveMonthsAgo.toISOString());

  // Initialize 12 months
  const revenueByMonth: Record<string, number> = {};
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    revenueByMonth[key] = 0;
  }

  for (const deal of wonDeals || []) {
    if (!deal.closed_at) continue;
    const d = new Date(deal.closed_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (key in revenueByMonth) {
      revenueByMonth[key] += parseFloat(deal.value || "0");
    }
  }

  const rows = Object.entries(revenueByMonth).map(([key, receita]) => {
    const [year, m] = key.split("-");
    return {
      month: `${MONTH_LABELS[parseInt(m, 10) - 1]}/${year.slice(2)}`,
      receita,
    };
  });

  return jsonSuccess({ type: "revenue-period", data: rows });
}

// ─── Response Time (placeholder) ─────────────────────────────

function responseTime() {
  return jsonSuccess({
    type: "response-time",
    data: [],
    message: "Relatório de tempo de resposta requer rastreamento de atividades. Dados insuficientes.",
  });
}

// ─── Team Performance ────────────────────────────────────────

async function teamPerformance(
  auth: { supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createServerClient>> },
  orgId: string,
  periodStart: string,
  wonStageIds: string[],
  lostStageIds: string[],
) {
  const closedIds = [...wonStageIds, ...lostStageIds];

  const [{ data: deals }, { data: members }] = await Promise.all([
    auth.supabase
      .from("deals")
      .select("id, value, stage_id, assigned_to_id, closed_at")
      .eq("organization_id", orgId)
      .in("stage_id", closedIds.length > 0 ? closedIds : ["__none__"])
      .gte("closed_at", periodStart),
    auth.supabase
      .from("organization_members")
      .select("id, name, role")
      .eq("organization_id", orgId),
  ]);

  const memberMap = new Map((members || []).map((m) => [m.id, m.name]));

  const teamStats: Record<string, { name: string; won: number; lost: number; revenue: number }> = {};

  for (const deal of deals || []) {
    const memberId = deal.assigned_to_id;
    if (!memberId) continue;
    const name = memberMap.get(memberId) || "Sem responsável";

    if (!teamStats[memberId]) {
      teamStats[memberId] = { name, won: 0, lost: 0, revenue: 0 };
    }

    if (wonStageIds.includes(deal.stage_id)) {
      teamStats[memberId].won++;
      teamStats[memberId].revenue += parseFloat(deal.value || "0");
    } else if (lostStageIds.includes(deal.stage_id)) {
      teamStats[memberId].lost++;
    }
  }

  const rows = Object.values(teamStats)
    .map((v) => ({
      ...v,
      total: v.won + v.lost,
      conversao: v.won + v.lost > 0 ? Math.round((v.won / (v.won + v.lost)) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  return jsonSuccess({ type: "team-performance", data: rows });
}

// ─── Activities Report ───────────────────────────────────────

async function activitiesReport(
  auth: { supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createServerClient>> },
  orgId: string,
  periodStart: string,
) {
  const [{ data: tasks }, { data: members }] = await Promise.all([
    auth.supabase
      .from("tasks")
      .select("id, type, status, assigned_to_id")
      .eq("organization_id", orgId)
      .gte("created_at", periodStart),
    auth.supabase
      .from("organization_members")
      .select("id, name")
      .eq("organization_id", orgId),
  ]);

  const memberMap = new Map((members || []).map((m) => [m.id, m.name]));

  const actStats: Record<string, { name: string; total: number; completed: number; pending: number; byType: Record<string, number> }> = {};

  for (const task of tasks || []) {
    const memberId = task.assigned_to_id;
    if (!memberId) continue;
    const name = memberMap.get(memberId) || "Sem responsável";

    if (!actStats[memberId]) {
      actStats[memberId] = { name, total: 0, completed: 0, pending: 0, byType: {} };
    }

    actStats[memberId].total++;
    if (task.status === "COMPLETED") {
      actStats[memberId].completed++;
    } else {
      actStats[memberId].pending++;
    }
    actStats[memberId].byType[task.type] = (actStats[memberId].byType[task.type] || 0) + 1;
  }

  const rows = Object.values(actStats)
    .map((v) => ({
      name: v.name,
      total: v.total,
      completed: v.completed,
      pending: v.pending,
      calls: v.byType["CALL"] || 0,
      emails: v.byType["EMAIL"] || 0,
      meetings: v.byType["MEETING"] || 0,
      followups: v.byType["FOLLOW_UP"] || 0,
    }))
    .sort((a, b) => b.total - a.total);

  return jsonSuccess({ type: "activities", data: rows });
}

// ─── Revenue Forecast ────────────────────────────────────────

async function revenueForecast(
  auth: { supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createServerClient>> },
  orgId: string,
  wonStageIds: string[],
  allStages: { id: string; name: string; order: number }[],
  lostStageIds: string[],
) {
  const now = new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const closedIds = [...wonStageIds, ...lostStageIds];

  // Historical revenue for average
  const { data: recentWon } = await auth.supabase
    .from("deals")
    .select("value, closed_at")
    .eq("organization_id", orgId)
    .in("stage_id", wonStageIds.length > 0 ? wonStageIds : ["__none__"])
    .gte("closed_at", threeMonthsAgo.toISOString());

  const totalRecentRevenue = (recentWon || []).reduce((s, d) => s + parseFloat(d.value || "0"), 0);
  const avgMonthlyRevenue = totalRecentRevenue / 3;

  // Active pipeline deals with stage-based probability
  const activeStages = allStages
    .filter((s) => !closedIds.includes(s.id))
    .sort((a, b) => a.order - b.order);

  const totalActiveStages = activeStages.length;
  const stageProbability = new Map(
    activeStages.map((s, i) => [s.id, totalActiveStages > 0 ? ((i + 1) / totalActiveStages) * 100 : 50]),
  );

  const { data: pipelineDeals } = await auth.supabase
    .from("deals")
    .select("id, title, value, stage_id")
    .eq("organization_id", orgId)
    .not("stage_id", "in", `(${closedIds.length > 0 ? closedIds.join(",") : "__none__"})`);

  const rows = (pipelineDeals || []).map((deal) => {
    const prob = stageProbability.get(deal.stage_id) ?? 50;
    const val = parseFloat(deal.value || "0");
    return {
      name: deal.title,
      value: val,
      probability: Math.round(prob),
      weighted: Math.round(val * (prob / 100) * 100) / 100,
      stage: allStages.find((s) => s.id === deal.stage_id)?.name ?? "—",
    };
  }).sort((a, b) => b.weighted - a.weighted);

  const totalWeighted = rows.reduce((s, r) => s + r.weighted, 0);

  return jsonSuccess({
    type: "revenue-forecast",
    data: rows,
    summary: {
      avgMonthlyRevenue: Math.round(avgMonthlyRevenue * 100) / 100,
      totalPipelineValue: rows.reduce((s, r) => s + r.value, 0),
      totalWeightedForecast: Math.round(totalWeighted * 100) / 100,
      dealsCount: rows.length,
    },
  });
}
