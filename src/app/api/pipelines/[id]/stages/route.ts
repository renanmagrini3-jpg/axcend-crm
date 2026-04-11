import { NextRequest } from "next/server";
import {
  getAuthContext,
  isErrorResponse,
  jsonError,
  jsonSuccess,
  type AuthContext,
} from "@/lib/api-utils";

type Params = { params: Promise<{ id: string }> };

async function assertPipelineBelongsToOrg(auth: AuthContext, pipelineId: string) {
  const { data } = await auth.supabase
    .from("pipelines")
    .select("id")
    .eq("id", pipelineId)
    .eq("organization_id", auth.organizationId)
    .maybeSingle();
  return !!data;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;

  if (!(await assertPipelineBelongsToOrg(auth, id))) {
    return jsonError("Pipeline não encontrado", 404);
  }

  const { data, error } = await auth.supabase
    .from("pipeline_stages")
    .select("*")
    .eq("pipeline_id", id)
    .order("order", { ascending: true });

  if (error) return jsonError(error.message, 500);

  return jsonSuccess(data ?? []);
}

export async function POST(req: NextRequest, { params }: Params) {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;

  if (!(await assertPipelineBelongsToOrg(auth, id))) {
    return jsonError("Pipeline não encontrado", 404);
  }

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

  const { data: maxRow } = await auth.supabase
    .from("pipeline_stages")
    .select("order")
    .eq("pipeline_id", id)
    .order("order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder =
    (maxRow as { order?: number } | null)?.order !== undefined
      ? ((maxRow as { order: number }).order ?? 0) + 1
      : 1;

  const { data, error } = await auth.supabase
    .from("pipeline_stages")
    .insert({
      name: name.toString().trim(),
      order: nextOrder,
      pipeline_id: id,
    })
    .select()
    .single();

  if (error) return jsonError(error.message, 500);

  return jsonSuccess(data, 201);
}
