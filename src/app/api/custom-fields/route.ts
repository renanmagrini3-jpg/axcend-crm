import { NextRequest } from "next/server";
import {
  getAuthContext,
  isErrorResponse,
  jsonError,
  jsonSuccess,
} from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  const entityType = req.nextUrl.searchParams.get("entity_type");

  let query = auth.supabase
    .from("custom_fields")
    .select("*")
    .eq("organization_id", auth.organizationId)
    .order("field_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (entityType) {
    query = query.eq("entity_type", entityType);
  }

  const { data, error } = await query;

  if (error) return jsonError(error.message, 500);

  return jsonSuccess(data ?? []);
}

const VALID_ENTITY_TYPES = ["deal", "contact", "company"];
const VALID_FIELD_TYPES = ["text", "number", "date", "select", "boolean"];

export async function POST(req: NextRequest) {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonError("JSON inválido", 400);
  }

  const {
    field_name,
    field_type,
    entity_type,
    field_options,
    is_required,
    field_order,
  } = body as {
    field_name?: string;
    field_type?: string;
    entity_type?: string;
    field_options?: unknown[];
    is_required?: boolean;
    field_order?: number;
  };

  if (!field_name || !field_name.toString().trim()) {
    return jsonError("Nome do campo é obrigatório", 400);
  }
  if (!entity_type || !VALID_ENTITY_TYPES.includes(entity_type)) {
    return jsonError("Tipo de entidade inválido", 400);
  }
  if (!field_type || !VALID_FIELD_TYPES.includes(field_type)) {
    return jsonError("Tipo de campo inválido", 400);
  }

  const insert: Record<string, unknown> = {
    field_name: field_name.toString().trim(),
    field_type,
    entity_type,
    organization_id: auth.organizationId,
  };

  if (field_options !== undefined) insert.field_options = field_options;
  if (is_required !== undefined) insert.is_required = !!is_required;
  if (field_order !== undefined) insert.field_order = field_order;

  const { data, error } = await auth.supabase
    .from("custom_fields")
    .insert(insert)
    .select()
    .single();

  if (error) return jsonError(error.message, 500);

  return jsonSuccess(data, 201);
}
