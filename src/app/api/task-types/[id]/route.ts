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

  const { name, icon, is_active } = body as {
    name?: string;
    icon?: string;
    is_active?: boolean;
  };

  const updates: Record<string, unknown> = {};
  if (name !== undefined) {
    if (!name.toString().trim()) {
      return jsonError("Nome é obrigatório", 400);
    }
    updates.name = name.toString().trim();
  }
  if (icon !== undefined) {
    updates.icon = icon?.toString().trim() || null;
  }
  if (is_active !== undefined) {
    updates.is_active = !!is_active;
  }

  if (Object.keys(updates).length === 0) {
    return jsonError("Nenhum campo para atualizar", 400);
  }

  const { data, error } = await auth.supabase
    .from("task_types")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .select()
    .single();

  if (error) return jsonError(error.message, 500);
  if (!data) return jsonError("Tipo não encontrado", 404);

  return jsonSuccess(data);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;

  const { error } = await auth.supabase
    .from("task_types")
    .delete()
    .eq("id", id)
    .eq("organization_id", auth.organizationId);

  if (error) return jsonError(error.message, 500);

  return new NextResponse(null, { status: 204 });
}
