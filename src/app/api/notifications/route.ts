import {
  getAuthContext,
  isErrorResponse,
  jsonSuccess,
  jsonError,
} from "@/lib/api-utils";

export async function GET() {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  const orgId = auth.organizationId;

  // Fetch recent automation logs (last 20)
  const { data: logs } = await auth.supabase
    .from("automation_logs")
    .select("id, status, message, executed_at, automation_id, automations(name)")
    .eq("automations.organization_id", orgId)
    .order("executed_at", { ascending: false })
    .limit(10);

  // Fetch overdue tasks assigned to user
  const { data: overdueTasks } = await auth.supabase
    .from("tasks")
    .select("id, title, due_at")
    .eq("organization_id", orgId)
    .eq("status", "OVERDUE")
    .order("due_at", { ascending: false })
    .limit(10);

  const notifications: Array<{
    id: string;
    type: "automation" | "task_overdue";
    title: string;
    description: string;
    timestamp: string;
  }> = [];

  for (const log of logs || []) {
    const automationName = (log.automations as unknown as { name: string } | null)?.name ?? "Automação";
    // Extract first meaningful step result from log message
    const message = log.message ?? "";
    const firstStep = message.split("\n").find((l: string) => l.includes(": ")) ?? "";
    const stepSummary = firstStep.replace(/^\[Passo \d+\] \w+: /, "").trim();
    const description = stepSummary || (log.status === "success" ? "Executada com sucesso" : "Execução registrada");

    notifications.push({
      id: `log-${log.id}`,
      type: "automation",
      title: `[Automação] ${automationName}`,
      description,
      timestamp: log.executed_at,
    });
  }

  for (const task of overdueTasks || []) {
    notifications.push({
      id: `task-${task.id}`,
      type: "task_overdue",
      title: "Tarefa atrasada",
      description: task.title,
      timestamp: task.due_at,
    });
  }

  // Sort by timestamp descending
  notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return jsonSuccess(notifications.slice(0, 15));
}
