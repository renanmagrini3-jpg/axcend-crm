import { NextRequest, NextResponse } from "next/server";
import {
  getAuthContext,
  isErrorResponse,
  jsonError,
  jsonSuccess,
} from "@/lib/api-utils";

type Params = { params: Promise<{ id: string }> };

const VALID_ROLES = new Set(["admin", "manager", "seller"]);

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

  const { role, name } = body as { role?: string; name?: string };

  const updates: Record<string, unknown> = {};
  if (role !== undefined) {
    if (!VALID_ROLES.has(role)) {
      return jsonError("Role inválida (admin, manager ou seller)", 400);
    }
    updates.role = role;
  }
  if (name !== undefined) {
    if (!name.toString().trim()) {
      return jsonError("Nome é obrigatório", 400);
    }
    updates.name = name.toString().trim();
  }

  if (Object.keys(updates).length === 0) {
    return jsonError("Nenhum campo para atualizar", 400);
  }

  const { data, error } = await auth.supabase
    .from("organization_members")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .select()
    .single();

  if (error) return jsonError(error.message, 500);
  if (!data) return jsonError("Membro não encontrado", 404);

  return jsonSuccess(data);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;

  const { error } = await auth.supabase
    .from("organization_members")
    .delete()
    .eq("id", id)
    .eq("organization_id", auth.organizationId);

  if (error) return jsonError(error.message, 500);

  return new NextResponse(null, { status: 204 });
}
