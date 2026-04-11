import { NextRequest, NextResponse } from "next/server";
import {
  getAuthContext,
  isErrorResponse,
  jsonError,
  jsonSuccess,
} from "@/lib/api-utils";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonError("JSON inválido", 400);
  }

  const { name } = body as { name?: string };
  if (!name || !name.toString().trim()) {
    return jsonError("Nome do pipeline é obrigatório", 400);
  }

  const { data, error } = await auth.supabase
    .from("pipelines")
    .update({ name: name.toString().trim() })
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .select()
    .single();

  if (error) return jsonError(error.message, 500);
  if (!data) return jsonError("Pipeline não encontrado", 404);

  return jsonSuccess(data);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;

  const { count: dealCount, error: countError } = await auth.supabase
    .from("deals")
    .select("id", { count: "exact", head: true })
    .eq("pipeline_id", id)
    .eq("organization_id", auth.organizationId);

  if (countError) return jsonError(countError.message, 500);

  if ((dealCount ?? 0) > 0) {
    return jsonError(
      `Não é possível excluir: ${dealCount} deal(s) usando este pipeline`,
      409,
    );
  }

  const { error } = await auth.supabase
    .from("pipelines")
    .delete()
    .eq("id", id)
    .eq("organization_id", auth.organizationId);

  if (error) return jsonError(error.message, 500);

  return new NextResponse(null, { status: 204 });
}
