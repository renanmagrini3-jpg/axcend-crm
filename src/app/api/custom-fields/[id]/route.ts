import { NextRequest, NextResponse } from "next/server";
import {
  getAuthContext,
  isErrorResponse,
  jsonError,
  jsonSuccess,
} from "@/lib/api-utils";

type Params = { params: Promise<{ id: string }> };

const VALID_FIELD_TYPES = ["text", "number", "date", "select", "boolean"];

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

  const { field_name, field_type, field_options, is_required, is_active, field_order } =
    body as {
      field_name?: string;
      field_type?: string;
      field_options?: unknown[];
      is_required?: boolean;
      is_active?: boolean;
      field_order?: number;
    };

  const updates: Record<string, unknown> = {};

  if (field_name !== undefined) {
    if (!field_name.toString().trim()) {
      return jsonError("Nome do campo é obrigatório", 400);
    }
    updates.field_name = field_name.toString().trim();
  }
  if (field_type !== undefined) {
    if (!VALID_FIELD_TYPES.includes(field_type)) {
      return jsonError("Tipo de campo inválido", 400);
    }
    updates.field_type = field_type;
  }
  if (field_options !== undefined) updates.field_options = field_options;
  if (is_required !== undefined) updates.is_required = !!is_required;
  if (is_active !== undefined) updates.is_active = !!is_active;
  if (field_order !== undefined) updates.field_order = field_order;

  if (Object.keys(updates).length === 0) {
    return jsonError("Nenhum campo para atualizar", 400);
  }

  const { data, error } = await auth.supabase
    .from("custom_fields")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .select()
    .single();

  if (error) return jsonError(error.message, 500);
  if (!data) return jsonError("Campo não encontrado", 404);

  return jsonSuccess(data);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;

  const { error } = await auth.supabase
    .from("custom_fields")
    .delete()
    .eq("id", id)
    .eq("organization_id", auth.organizationId);

  if (error) return jsonError(error.message, 500);

  return new NextResponse(null, { status: 204 });
}
