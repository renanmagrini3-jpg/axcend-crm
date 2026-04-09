import { NextRequest } from "next/server";
import {
  getAuthContext,
  isErrorResponse,
  jsonError,
  jsonSuccess,
} from "@/lib/api-utils";

type Period = "month" | "quarter" | "year";

function getPeriodStart(period: Period): string {
  const now = new Date();
  switch (period) {
    case "month": {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      return d.toISOString();
    }
    case "quarter": {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      const d = new Date(now.getFullYear(), qMonth, 1);
      return d.toISOString();
    }
    case "year": {
      const d = new Date(now.getFullYear(), 0, 1);
      return d.toISOString();
    }
  }
}

export async function GET(req: NextRequest) {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  const { searchParams } = req.nextUrl;
  const period = (searchParams.get("period") || "month") as Period;

  if (!["month", "quarter", "year"].includes(period)) {
    return jsonError("Período inválido", 400);
  }

  const orgId = auth.organizationId;
  const periodStart = getPeriodStart(period);

  // ── Fetch pipeline stages to identify won/lost ──
  const { data: allStages } = await auth.supabase
    .from("pipeline_stages")
    .select("id, name, pipelines!inner(organization_id)")
    .eq("pipelines.organization_id", orgId);

  const wonStageIds: string[] = [];
  const lostStageIds: string[] = [];

  if (allStages) {
    for (const s of allStages) {
      if (s.name === "Fechado Ganho") wonStageIds.push(s.id);
      if (s.name === "Fechado Perdido") lostStageIds.push(s.id);
    }
  }

  const closedStageIds = [...wonStageIds, ...lostStageIds];

  // ── Fetch closed deals in the period ──
  const { data: closedDeals } = await auth.supabase
    .from("deals")
    .select("id, value, stage_id, assigned_to_id")
    .eq("organization_id", orgId)
    .in("stage_id", closedStageIds.length > 0 ? closedStageIds : ["__none__"])
    .gte("updated_at", periodStart);

  // ── Fetch completed tasks in the period ──
  const { data: completedTasks } = await auth.supabase
    .from("tasks")
    .select("id, assigned_to_id")
    .eq("organization_id", orgId)
    .eq("status", "COMPLETED")
    .gte("completed_at", periodStart);

  // ── Fetch all users in the organization (sellers) ──
  const { data: users } = await auth.supabase
    .from("users")
    .select("id, name, avatar_url")
    .eq("organization_id", orgId);

  if (!users || users.length === 0) {
    return jsonSuccess([]);
  }

  // ── Aggregate per seller ──
  interface SellerStats {
    id: string;
    name: string;
    avatar: string | null;
    dealsWon: number;
    dealsLost: number;
    revenue: number;
    tasksCompleted: number;
  }

  const statsMap = new Map<string, SellerStats>();

  for (const user of users) {
    statsMap.set(user.id, {
      id: user.id,
      name: user.name,
      avatar: user.avatar_url,
      dealsWon: 0,
      dealsLost: 0,
      revenue: 0,
      tasksCompleted: 0,
    });
  }

  for (const deal of closedDeals || []) {
    const stat = statsMap.get(deal.assigned_to_id);
    if (!stat) continue;

    if (wonStageIds.includes(deal.stage_id)) {
      stat.dealsWon++;
      stat.revenue += parseFloat(deal.value || "0");
    } else if (lostStageIds.includes(deal.stage_id)) {
      stat.dealsLost++;
    }
  }

  for (const task of completedTasks || []) {
    const stat = statsMap.get(task.assigned_to_id);
    if (stat) {
      stat.tasksCompleted++;
    }
  }

  // ── Build ranking sorted by revenue ──
  const ranking = Array.from(statsMap.values())
    .filter((s) => s.dealsWon > 0 || s.dealsLost > 0 || s.tasksCompleted > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .map((s, i) => {
      const totalClosed = s.dealsWon + s.dealsLost;
      const conversionRate = totalClosed > 0
        ? Math.round((s.dealsWon / totalClosed) * 1000) / 10
        : 0;

      return {
        position: i + 1,
        id: s.id,
        name: s.name,
        avatar: s.avatar,
        revenue: s.revenue,
        dealsWon: s.dealsWon,
        dealsLost: s.dealsLost,
        conversionRate,
        tasksCompleted: s.tasksCompleted,
      };
    });

  return jsonSuccess(ranking);
}
