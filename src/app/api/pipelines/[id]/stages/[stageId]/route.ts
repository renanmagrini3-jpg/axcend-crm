import { NextRequest, NextResponse } from "next/server";
import {
  getAuthContext,
  isErrorResponse,
  jsonError,
  jsonSuccess,
} from "@/lib/api-utils";

type Params = { params: Promise<{ id: string; stageId: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  const { id, stageId } = await params;

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

  const { name } = body as { name?: string };
  if (!name || !name.toString().trim()) {
    return jsonError("Nome da etapa é obrigatório", 400);
  }

  const { data, error } = await auth.supabase
    .from("pipeline_stages")
    .update({ name: name.toString().trim() })
    .eq("id", stageId)
    .eq("pipeline_id", id)
    .select()
    .single();

  if (error) return jsonError(error.message, 500);
  if (!data) return jsonError("Etapa não encontrada", 404);

  return jsonSuccess(data);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  const { id, stageId } = await params;

  const { data: pipeline } = await auth.supabase
    .from("pipelines")
    .select("id")
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .maybeSingle();

  if (!pipeline) return jsonError("Pipeline não encontrado", 404);

  const { count: dealCount, error: countError } = await auth.supabase
    .from("deals")
    .select("id", { count: "exact", head: true })
    .eq("stage_id", stageId)
    .eq("organization_id", auth.organizationId);

  if (countError) return jsonError(countError.message, 500);

  if ((dealCount ?? 0) > 0) {
    return jsonError(
      `Não é possível excluir: ${dealCount} deal(s) nesta etapa`,
      409,
    );
  }

  const { error } = await auth.supabase
    .from("pipeline_stages")
    .delete()
    .eq("id", stageId)
    .eq("pipeline_id", id);

  if (error) return jsonError(error.message, 500);

  return new NextResponse(null, { status: 204 });
}
