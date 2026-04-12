import { NextRequest, NextResponse } from "next/server";
import {
  getAuthContext,
  isErrorResponse,
  jsonError,
} from "@/lib/api-utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface StepConfig {
  task_title?: string;
  task_type?: string;
  task_priority?: string;
  task_due_days?: number;
  stage_id?: string;
  field_name?: string;
  field_value?: string;
  entity?: string;
  entity_id?: string;
  note_content?: string;
  wait_seconds?: number;
}

interface AutomationStep {
  id: string;
  step_order: number;
  step_type: string;
  step_config: StepConfig;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;

  const { data: automation, error: fetchError } = await auth.supabase
    .from("automations")
    .select("id, name, is_active, execution_count, automation_steps(id, step_order, step_type, step_config)")
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .single();

  if (fetchError || !automation) {
    return jsonError("Automação não encontrada", 404);
  }

  if (!automation.is_active) {
    return jsonError("Automação está desativada", 400);
  }

  const steps = (
    (automation.automation_steps as AutomationStep[]) ?? []
  ).sort((a, b) => a.step_order - b.step_order);

  const executedAt = new Date().toISOString();
  const logMessages: string[] = [];
  let status = "success";

  if (steps.length === 0) {
    logMessages.push("Nenhum passo configurado. Configure passos no editor de workflow.");
  }

  for (const step of steps) {
    try {
      const result = await executeStep(auth, step);
      logMessages.push(`[Passo ${step.step_order}] ${step.step_type}: ${result}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      logMessages.push(`[Passo ${step.step_order}] ${step.step_type}: ERRO — ${msg}`);
      status = "partial";
    }
  }

  const { error: logError } = await auth.supabase
    .from("automation_logs")
    .insert({
      automation_id: automation.id,
      status,
      message: logMessages.join("\n"),
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

  return NextResponse.json({ ...updated, _executionLog: logMessages, _executionStatus: status });
}

async function executeStep(
  auth: { supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createServerClient>>; userId: string; organizationId: string },
  step: AutomationStep,
): Promise<string> {
  const cfg = step.step_config ?? {};

  switch (step.step_type) {
    case "create_task": {
      const dueAt = new Date();
      dueAt.setDate(dueAt.getDate() + (cfg.task_due_days ?? 1));

      const { error } = await auth.supabase.from("tasks").insert({
        title: cfg.task_title || `Tarefa automática`,
        type: cfg.task_type || "CUSTOM",
        priority: cfg.task_priority || "MEDIUM",
        status: "PENDING",
        due_at: dueAt.toISOString(),
        assigned_to_id: auth.userId,
        organization_id: auth.organizationId,
        deal_id: cfg.entity === "deal" ? cfg.entity_id : null,
        contact_id: cfg.entity === "contact" ? cfg.entity_id : null,
      });

      if (error) throw new Error(error.message);
      return `Tarefa "${cfg.task_title || "Tarefa automática"}" criada com sucesso`;
    }

    case "move_deal": {
      if (!cfg.entity_id || !cfg.stage_id) {
        return "Passo ignorado — deal_id ou stage_id não configurados";
      }

      const { error } = await auth.supabase
        .from("deals")
        .update({ stage_id: cfg.stage_id })
        .eq("id", cfg.entity_id)
        .eq("organization_id", auth.organizationId);

      if (error) throw new Error(error.message);
      return `Deal movido para etapa ${cfg.stage_id}`;
    }

    case "update_field": {
      if (!cfg.entity_id || !cfg.field_name || cfg.field_value === undefined) {
        return "Passo ignorado — configuração incompleta (entity_id, field_name, field_value)";
      }

      const table = cfg.entity === "contact" ? "contacts" : "deals";
      const { error } = await auth.supabase
        .from(table)
        .update({ [cfg.field_name]: cfg.field_value })
        .eq("id", cfg.entity_id)
        .eq("organization_id", auth.organizationId);

      if (error) throw new Error(error.message);
      return `Campo "${cfg.field_name}" atualizado em ${table}`;
    }

    case "send_notification": {
      const content = cfg.note_content || `Notificação automática da automação`;
      if (cfg.entity === "deal" && cfg.entity_id) {
        const { error } = await auth.supabase.from("deal_notes").insert({
          deal_id: cfg.entity_id,
          content: `[Automação] ${content}`,
          author_name: "Sistema",
        });
        if (error) throw new Error(error.message);
        return `Nota de notificação adicionada ao deal`;
      }
      return `Notificação registrada: "${content}" (e-mail será fase 2)`;
    }

    case "wait": {
      const seconds = cfg.wait_seconds ?? 0;
      return `Espera de ${seconds}s ignorada (execução síncrona — filas serão fase 2)`;
    }

    default:
      return `Tipo de passo "${step.step_type}" não reconhecido`;
  }
}
