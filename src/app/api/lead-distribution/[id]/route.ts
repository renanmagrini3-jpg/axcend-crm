import { NextRequest, NextResponse } from "next/server";
import {
  getAuthContext,
  isErrorResponse,
  jsonError,
  jsonSuccess,
} from "@/lib/api-utils";

type Params = { params: Promise<{ id: string }> };

const VALID_RULE_TYPES = [
  "round_robin",
  "weighted",
  "territory",
  "segment",
  "value_based",
  "hybrid",
  "custom",
];

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

  const { name, description, rule_type, rule_config, is_active, priority } =
    body as {
      name?: string;
      description?: string;
      rule_type?: string;
      rule_config?: Record<string, unknown>;
      is_active?: boolean;
      priority?: number;
    };

  const updates: Record<string, unknown> = {};

  if (name !== undefined) {
    if (!name.toString().trim()) {
      return jsonError("Nome é obrigatório", 400);
    }
    updates.name = name.toString().trim();
  }
  if (description !== undefined) updates.description = description.toString().trim();
  if (rule_type !== undefined) {
    if (!VALID_RULE_TYPES.includes(rule_type)) {
      return jsonError("Tipo de regra inválido", 400);
    }
    updates.rule_type = rule_type;
  }
  if (rule_config !== undefined) updates.rule_config = rule_config;
  if (is_active !== undefined) updates.is_active = !!is_active;
  if (priority !== undefined) updates.priority = priority;

  if (Object.keys(updates).length === 0) {
    return jsonError("Nenhum campo para atualizar", 400);
  }

  const { data, error } = await auth.supabase
    .from("lead_distribution_rules")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .select()
    .single();

  if (error) return jsonError(error.message, 500);
  if (!data) return jsonError("Regra não encontrada", 404);

  return jsonSuccess(data);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;

  const { error } = await auth.supabase
    .from("lead_distribution_rules")
    .delete()
    .eq("id", id)
    .eq("organization_id", auth.organizationId);

  if (error) return jsonError(error.message, 500);

  return new NextResponse(null, { status: 204 });
}
