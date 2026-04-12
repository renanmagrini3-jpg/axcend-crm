import { NextRequest } from "next/server";
import {
  getAuthContext,
  isErrorResponse,
  jsonError,
  jsonSuccess,
} from "@/lib/api-utils";

export async function GET(_req: NextRequest) {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  const { data, error } = await auth.supabase
    .from("organizations")
    .select("id, name, slug, mode, logo, plan, created_at, updated_at")
    .eq("id", auth.organizationId)
    .single();

  if (error || !data) return jsonError("Organização não encontrada", 404);

  return jsonSuccess(data);
}

export async function PUT(req: NextRequest) {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonError("JSON inválido", 400);
  }

  const { name, mode } = body as { name?: string; mode?: string };

  const updates: Record<string, unknown> = {};
  if (name !== undefined) {
    if (!name.toString().trim()) {
      return jsonError("Nome é obrigatório", 400);
    }
    updates.name = name.toString().trim();
  }
  if (mode !== undefined) {
    if (mode !== "B2B" && mode !== "B2C") {
      return jsonError("Modo deve ser B2B ou B2C", 400);
    }
    updates.mode = mode;
  }

  if (Object.keys(updates).length === 0) {
    return jsonError("Nenhum campo para atualizar", 400);
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await auth.supabase
    .from("organizations")
    .update(updates)
    .eq("id", auth.organizationId)
    .select("id, name, slug, mode, logo, plan, created_at, updated_at")
    .single();

  if (error) return jsonError(error.message, 500);
  if (!data) return jsonError("Organização não encontrada", 404);

  return jsonSuccess(data);
}
