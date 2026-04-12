import { NextRequest } from "next/server";
import {
  getAuthContext,
  isErrorResponse,
  jsonError,
  jsonSuccess,
} from "@/lib/api-utils";

type Period = "today" | "week" | "month" | "quarter" | "year";

function getPeriodRange(period: Period): { start: string; end: string } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  let start: Date;
  switch (period) {
    case "today":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "week": {
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1; // Monday as first day
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
      break;
    }
    case "month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "quarter": {
      const q = Math.floor(now.getMonth() / 3) * 3;
      start = new Date(now.getFullYear(), q, 1);
      break;
    }
    case "year":
      start = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

function getPreviousPeriodRange(period: Period): { start: string; end: string } {
  const now = new Date();

  switch (period) {
    case "today": {
      const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      return {
        start: new Date(y.getFullYear(), y.getMonth(), y.getDate()).toISOString(),
        end: new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999).toISOString(),
      };
    }
    case "week": {
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1;
      const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
      const prevMonday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() - 7);
      const prevEnd = new Date(monday.getTime() - 1);
      return { start: prevMonday.toISOString(), end: prevEnd.toISOString() };
    }
    case "month": {
      const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start: prevStart.toISOString(), end: prevEnd.toISOString() };
    }
    case "quarter": {
      const q = Math.floor(now.getMonth() / 3) * 3;
      const prevStart = new Date(now.getFullYear(), q - 3, 1);
      const prevEnd = new Date(now.getFullYear(), q, 0, 23, 59, 59, 999);
      return { start: prevStart.toISOString(), end: prevEnd.toISOString() };
    }
    case "year": {
      return {
        start: new Date(now.getFullYear() - 1, 0, 1).toISOString(),
        end: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999).toISOString(),
      };
    }
    default:
      return getPreviousPeriodRange("month");
  }
}

function calcChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? null : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export async function GET(req: NextRequest) {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  const { searchParams } = req.nextUrl;
  const period = (searchParams.get("period") || "month") as Period;
  const { start, end } = getPeriodRange(period);
  const { start: prevStart, end: prevEnd } = getPreviousPeriodRange(period);
  const orgId = auth.organizationId;

  // ── Fetch all pipeline stages to identify won/lost ──
  const { data: pipelines } = await auth.supabase
    .from("pipelines")
    .select("id, pipeline_stages(id, name, \"order\")")
    .eq("organization_id", orgId);

  const allStages: { id: string; name: string; order: number }[] = [];
  const wonStageIds: string[] = [];
  const lostStageIds: string[] = [];

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

  const closedIds = [...wonStageIds, ...lostStageIds];
  const safeWonIds = wonStageIds.length > 0 ? wonStageIds : ["__none__"];
  const safeLostIds = lostStageIds.length > 0 ? lostStageIds : ["__none__"];
  const safeClosedIds = closedIds.length > 0 ? closedIds : ["__none__"];

  // ══════════════════════════════════════════════════════
  // ── 1. Stat Cards — current period + previous period ─
  // ══════════════════════════════════════════════════════

  // Parallel queries for current period
  const [
    { data: wonDeals },
    { count: lostCount },
    { count: totalDealsCount },
    { count: completedTasksCount },
  ] = await Promise.all([
    auth.supabase
      .from("deals")
      .select("value, closed_at")
      .eq("organization_id", orgId)
      .in("stage_id", safeWonIds)
      .gte("closed_at", start)
      .lte("closed_at", end),
    auth.supabase
      .from("deals")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .in("stage_id", safeLostIds)
      .gte("closed_at", start)
      .lte("closed_at", end),
    auth.supabase
      .from("deals")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .gte("created_at", start)
      .lte("created_at", end),
    auth.supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "COMPLETED")
      .gte("updated_at", start)
      .lte("updated_at", end),
  ]);

  // Parallel queries for previous period
  const [
    { data: prevWonDeals },
    { count: prevLostCount },
    { count: prevTotalDealsCount },
    { count: prevCompletedTasksCount },
  ] = await Promise.all([
    auth.supabase
      .from("deals")
      .select("value, closed_at")
      .eq("organization_id", orgId)
      .in("stage_id", safeWonIds)
      .gte("closed_at", prevStart)
      .lte("closed_at", prevEnd),
    auth.supabase
      .from("deals")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .in("stage_id", safeLostIds)
      .gte("closed_at", prevStart)
      .lte("closed_at", prevEnd),
    auth.supabase
      .from("deals")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .gte("created_at", prevStart)
      .lte("created_at", prevEnd),
    auth.supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "COMPLETED")
      .gte("updated_at", prevStart)
      .lte("updated_at", prevEnd),
  ]);

  // Current period metrics
  const revenue = (wonDeals || []).reduce((sum, d) => sum + parseFloat(d.value || "0"), 0);
  const wonCount = (wonDeals || []).length;
  const totalClosed = wonCount + (lostCount || 0);
  const conversionRate = totalClosed > 0 ? (wonCount / totalClosed) * 100 : 0;
  const averageTicket = wonCount > 0 ? revenue / wonCount : 0;
  const totalDeals = totalDealsCount ?? 0;
  const completedTasks = completedTasksCount ?? 0;

  // Previous period metrics
  const prevRevenue = (prevWonDeals || []).reduce((sum, d) => sum + parseFloat(d.value || "0"), 0);
  const prevWonCount = (prevWonDeals || []).length;
  const prevTotalClosed = prevWonCount + (prevLostCount || 0);
  const prevConversionRate = prevTotalClosed > 0 ? (prevWonCount / prevTotalClosed) * 100 : 0;
  const prevAverageTicket = prevWonCount > 0 ? prevRevenue / prevWonCount : 0;
  const prevTotalDeals = prevTotalDealsCount ?? 0;
  const prevCompletedTasks = prevCompletedTasksCount ?? 0;

  // Deals in pipeline (snapshot — no period comparison)
  let pipelineQuery = auth.supabase
    .from("deals")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId);

  if (closedIds.length > 0) {
    for (const id of closedIds) {
      pipelineQuery = pipelineQuery.neq("stage_id", id);
    }
  }

  const { count: dealsInPipeline } = await pipelineQuery;

  // ── 2. Revenue chart (last 6 months) ──
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const { data: revenueDeals } = await auth.supabase
    .from("deals")
    .select("value, closed_at")
    .eq("organization_id", orgId)
    .in("stage_id", safeWonIds)
    .gte("closed_at", sixMonthsAgo.toISOString());

  const revenueByMonth: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    revenueByMonth[key] = 0;
  }

  for (const deal of revenueDeals || []) {
    if (!deal.closed_at) continue;
    const d = new Date(deal.closed_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (key in revenueByMonth) {
      revenueByMonth[key] += parseFloat(deal.value || "0");
    }
  }

  const revenueChart = Object.entries(revenueByMonth).map(([key, val]) => {
    const [, m] = key.split("-");
    return { month: MONTH_LABELS[parseInt(m, 10) - 1], receita: val };
  });

  // ── 3. Funnel: deals per stage of first active pipeline ──
  const { data: funnelDeals } = await auth.supabase
    .from("deals")
    .select("stage_id, pipeline_stages(id, name, \"order\")")
    .eq("organization_id", orgId);

  const stageCounts: Record<string, { name: string; order: number; count: number }> = {};
  for (const s of allStages) {
    if (s.name !== "Fechado Ganho" && s.name !== "Fechado Perdido") {
      stageCounts[s.id] = { name: s.name, order: s.order, count: 0 };
    }
  }

  for (const deal of funnelDeals || []) {
    if (stageCounts[deal.stage_id]) {
      stageCounts[deal.stage_id].count++;
    }
  }

  const FUNNEL_COLORS = ["#F97316", "#FB923C", "#FDBA74", "#A3A3A3", "#737373", "#525252", "#404040"];
  const funnelChart = Object.values(stageCounts)
    .sort((a, b) => a.order - b.order)
    .map((s, i) => ({
      stage: s.name,
      deals: s.count,
      fill: FUNNEL_COLORS[i % FUNNEL_COLORS.length],
    }));

  // ── 4. Won vs Lost per month (last 6 months) ──
  const { data: closedDeals } = await auth.supabase
    .from("deals")
    .select("stage_id, closed_at")
    .eq("organization_id", orgId)
    .in("stage_id", safeClosedIds)
    .gte("closed_at", sixMonthsAgo.toISOString());

  const wonLostByMonth: Record<string, { ganhos: number; perdidos: number }> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    wonLostByMonth[key] = { ganhos: 0, perdidos: 0 };
  }

  for (const deal of closedDeals || []) {
    if (!deal.closed_at) continue;
    const d = new Date(deal.closed_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (key in wonLostByMonth) {
      if (wonStageIds.includes(deal.stage_id)) {
        wonLostByMonth[key].ganhos++;
      } else if (lostStageIds.includes(deal.stage_id)) {
        wonLostByMonth[key].perdidos++;
      }
    }
  }

  const wonLostChart = Object.entries(wonLostByMonth).map(([key, val]) => {
    const [, m] = key.split("-");
    return { month: MONTH_LABELS[parseInt(m, 10) - 1], ...val };
  });

  // ── 5. Loss reasons ──
  const { data: lostDealsReasons } = await auth.supabase
    .from("deals")
    .select("loss_reason")
    .eq("organization_id", orgId)
    .in("stage_id", safeLostIds)
    .not("loss_reason", "is", null);

  const reasonCounts: Record<string, number> = {};
  for (const deal of lostDealsReasons || []) {
    const reason = deal.loss_reason || "Não informado";
    reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
  }

  const LOSS_COLORS = ["#F97316", "#FB923C", "#FDBA74", "#A3A3A3", "#525252"];
  const lossReasonsChart = Object.entries(reasonCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], i) => ({
      name,
      value,
      fill: LOSS_COLORS[i % LOSS_COLORS.length],
    }));

  // ── 6. Today's tasks ──
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

  const { data: todayTasks } = await auth.supabase
    .from("tasks")
    .select("id, title, type, status, due_at, contacts(id, name)")
    .eq("organization_id", orgId)
    .eq("status", "PENDING")
    .gte("due_at", todayStart)
    .lte("due_at", todayEnd)
    .order("due_at", { ascending: true })
    .limit(10);

  // ── 7. Recent deals ──
  const { data: recentDeals } = await auth.supabase
    .from("deals")
    .select("id, title, value, priority, pipeline_stages(id, name)")
    .eq("organization_id", orgId)
    .order("updated_at", { ascending: false })
    .limit(5);

  return jsonSuccess({
    stats: {
      totalDeals,
      totalDealsChange: calcChange(totalDeals, prevTotalDeals),
      revenue,
      revenueChange: calcChange(revenue, prevRevenue),
      conversionRate: Math.round(conversionRate * 10) / 10,
      conversionRateChange: calcChange(conversionRate, prevConversionRate),
      averageTicket: Math.round(averageTicket * 100) / 100,
      averageTicketChange: calcChange(averageTicket, prevAverageTicket),
      dealsInPipeline: dealsInPipeline ?? 0,
      completedTasks,
      completedTasksChange: calcChange(completedTasks, prevCompletedTasks),
    },
    charts: {
      revenue: revenueChart,
      funnel: funnelChart,
      wonLost: wonLostChart,
      lossReasons: lossReasonsChart,
    },
    todayTasks: (todayTasks || []).map((t) => ({
      id: t.id,
      title: t.title,
      type: t.type,
      status: t.status,
      time: new Date(t.due_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      contact: ((t.contacts as unknown as { id: string; name: string } | null))?.name || "—",
    })),
    recentDeals: (recentDeals || []).map((d) => ({
      id: d.id,
      name: d.title,
      value: parseFloat(d.value || "0"),
      stage: ((d.pipeline_stages as unknown as { id: string; name: string } | null))?.name || "—",
      priority: (d.priority || "MEDIUM").toLowerCase() as "high" | "medium" | "low",
    })),
  });
}
