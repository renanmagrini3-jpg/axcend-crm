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

  const { data: pipeline } = await auth.supabase
    .from("pipelines")
    .select("id")
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .maybeSingle();

  if (!pipeline) return jsonError("Pipeline não encontrado", 404);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonError("JSON inválido", 400);
  }

  const { stages } = body as {
    stages?: Array<{ id: string; order: number }>;
  };

  if (!Array.isArray(stages) || stages.length === 0) {
    return jsonError("Lista de etapas obrigatória", 400);
  }

  const { data: existing, error: fetchError } = await auth.supabase
    .from("pipeline_stages")
    .select("id")
    .eq("pipeline_id", id);

  if (fetchError) return jsonError(fetchError.message, 500);

  const validIds = new Set((existing ?? []).map((s: { id: string }) => s.id));
  for (const s of stages) {
    if (!validIds.has(s.id)) {
      return jsonError(`Etapa ${s.id} não pertence a este pipeline`, 400);
    }
  }

  for (const s of stages) {
    const { error } = await auth.supabase
      .from("pipeline_stages")
      .update({ order: s.order })
      .eq("id", s.id)
      .eq("pipeline_id", id);

    if (error) return jsonError(error.message, 500);
  }

  const { data: updated } = await auth.supabase
    .from("pipeline_stages")
    .select("*")
    .eq("pipeline_id", id)
    .order("order", { ascending: true });

  return jsonSuccess(updated ?? []);
}
