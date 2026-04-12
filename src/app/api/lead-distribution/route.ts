import { NextRequest } from "next/server";
import {
  getAuthContext,
  isErrorResponse,
  jsonError,
  jsonSuccess,
} from "@/lib/api-utils";

const VALID_RULE_TYPES = [
  "round_robin",
  "weighted",
  "territory",
  "segment",
  "value_based",
  "hybrid",
  "custom",
];

export async function GET() {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  const { data, error } = await auth.supabase
    .from("lead_distribution_rules")
    .select("*")
    .eq("organization_id", auth.organizationId)
    .order("priority", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return jsonError(error.message, 500);

  return jsonSuccess(data ?? []);
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

  const { name, description, rule_type, rule_config, is_active, priority } =
    body as {
      name?: string;
      description?: string;
      rule_type?: string;
      rule_config?: Record<string, unknown>;
      is_active?: boolean;
      priority?: number;
    };

  if (!name || !name.toString().trim()) {
    return jsonError("Nome é obrigatório", 400);
  }
  if (!rule_type || !VALID_RULE_TYPES.includes(rule_type)) {
    return jsonError("Tipo de regra inválido", 400);
  }

  const insert: Record<string, unknown> = {
    name: name.toString().trim(),
    rule_type,
    organization_id: auth.organizationId,
  };

  if (description !== undefined) insert.description = description.toString().trim();
  if (rule_config !== undefined) insert.rule_config = rule_config;
  if (is_active !== undefined) insert.is_active = !!is_active;
  if (priority !== undefined) insert.priority = priority;

  const { data, error } = await auth.supabase
    .from("lead_distribution_rules")
    .insert(insert)
    .select()
    .single();

  if (error) return jsonError(error.message, 500);

  return jsonSuccess(data, 201);
}
