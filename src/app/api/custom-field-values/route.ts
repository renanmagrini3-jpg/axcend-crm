import { NextRequest } from "next/server";
import {
  getAuthContext,
  isErrorResponse,
  jsonError,
  jsonSuccess,
} from "@/lib/api-utils";

const VALID_ENTITY_TYPES = ["deal", "contact", "company"];

export async function GET(req: NextRequest) {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  const entityId = req.nextUrl.searchParams.get("entity_id");
  const entityType = req.nextUrl.searchParams.get("entity_type");

  if (!entityId || !entityType) {
    return jsonError("entity_id e entity_type são obrigatórios", 400);
  }

  if (!VALID_ENTITY_TYPES.includes(entityType)) {
    return jsonError("entity_type inválido", 400);
  }

  const { data, error } = await auth.supabase
    .from("custom_field_values")
    .select("id, custom_field_id, entity_id, entity_type, value, created_at, updated_at")
    .eq("entity_id", entityId)
    .eq("entity_type", entityType)
    .eq("organization_id", auth.organizationId);

  if (error) return jsonError(error.message, 500);

  return jsonSuccess(data ?? []);
}

interface FieldValuePayload {
  custom_field_id: string;
  value: string;
}

export async function POST(req: NextRequest) {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonError("JSON inválido", 400);
  }

  const { entity_id, entity_type, values } = body as {
    entity_id?: string;
    entity_type?: string;
    values?: FieldValuePayload[];
  };

  if (!entity_id || !entity_type) {
    return jsonError("entity_id e entity_type são obrigatórios", 400);
  }
  if (!VALID_ENTITY_TYPES.includes(entity_type)) {
    return jsonError("entity_type inválido", 400);
  }
  if (!values || !Array.isArray(values) || values.length === 0) {
    return jsonError("values é obrigatório e deve ser um array", 400);
  }

  // Upsert each value (insert on conflict update)
  const results = [];
  for (const { custom_field_id, value } of values) {
    if (!custom_field_id) continue;

    // Try update first, then insert if not found
    const { data: existing } = await auth.supabase
      .from("custom_field_values")
      .select("id")
      .eq("custom_field_id", custom_field_id)
      .eq("entity_id", entity_id)
      .eq("organization_id", auth.organizationId)
      .maybeSingle();

    if (existing) {
      const { data, error } = await auth.supabase
        .from("custom_field_values")
        .update({ value, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
        .eq("organization_id", auth.organizationId)
        .select()
        .single();

      if (error) return jsonError(error.message, 500);
      results.push(data);
    } else {
      const { data, error } = await auth.supabase
        .from("custom_field_values")
        .insert({
          custom_field_id,
          entity_id,
          entity_type,
          value,
          organization_id: auth.organizationId,
        })
        .select()
        .single();

      if (error) return jsonError(error.message, 500);
      results.push(data);
    }
  }

  return jsonSuccess(results);
}
