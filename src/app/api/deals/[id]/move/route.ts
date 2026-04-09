import { NextRequest } from "next/server";
import {
  getAuthContext,
  isErrorResponse,
  jsonError,
  jsonSuccess,
} from "@/lib/api-utils";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonError("JSON inválido", 400);
  }

  const { stage_id, loss_reason } = body as {
    stage_id?: string;
    loss_reason?: string;
  };

  if (!stage_id) {
    return jsonError("stage_id é obrigatório", 400);
  }

  // Fetch the target stage to check if it's "Fechado Perdido"
  const { data: stage, error: stageError } = await auth.supabase
    .from("pipeline_stages")
    .select("id, name")
    .eq("id", stage_id)
    .single();

  if (stageError || !stage) {
    return jsonError("Etapa não encontrada", 404);
  }

  if (stage.name === "Fechado Perdido" && (!loss_reason || !loss_reason.trim())) {
    return jsonError("Motivo da perda é obrigatório para 'Fechado Perdido'", 400);
  }

  const updates: Record<string, unknown> = { stage_id };

  if (stage.name === "Fechado Perdido") {
    updates.loss_reason = loss_reason!.trim();
    updates.closed_at = new Date().toISOString();
  } else if (stage.name === "Fechado Ganho") {
    updates.closed_at = new Date().toISOString();
    updates.loss_reason = null;
  } else {
    updates.closed_at = null;
    updates.loss_reason = null;
  }

  const { data, error } = await auth.supabase
    .from("deals")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .select(
      "*, contacts(id, name, email, phone), companies(id, name), pipeline_stages(id, name, \"order\")",
    )
    .single();

  if (error) {
    return jsonError(error.message, 500);
  }

  if (!data) {
    return jsonError("Deal não encontrado", 404);
  }

  return jsonSuccess(data);
}
