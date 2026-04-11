import { NextRequest, NextResponse } from "next/server";
import {
  getAuthContext,
  isErrorResponse,
  jsonError,
} from "@/lib/api-utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;

  const { data: automation, error: fetchError } = await auth.supabase
    .from("automations")
    .select("id, is_active, execution_count")
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .single();

  if (fetchError || !automation) {
    return jsonError("Automação não encontrada", 404);
  }

  if (!automation.is_active) {
    return jsonError("Automação está desativada", 400);
  }

  const executedAt = new Date().toISOString();

  const { error: logError } = await auth.supabase
    .from("automation_logs")
    .insert({
      automation_id: automation.id,
      status: "success",
      message: "Execução manual disparada pelo usuário.",
      executed_at: executedAt,
    });

  if (logError) {
    return jsonError(logError.message, 500);
  }

  const { data: updated, error: updateError } = await auth.supabase
    .from("automations")
    .update({
      execution_count: (automation.execution_count ?? 0) + 1,
      last_executed_at: executedAt,
    })
    .eq("id", automation.id)
    .eq("organization_id", auth.organizationId)
    .select("*, automation_steps(id, step_order, step_type, step_config)")
    .single();

  if (updateError) {
    return jsonError(updateError.message, 500);
  }

  return NextResponse.json(updated);
}
