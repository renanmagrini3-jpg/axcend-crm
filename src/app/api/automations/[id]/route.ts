import { NextRequest, NextResponse } from "next/server";
import {
  getAuthContext,
  isErrorResponse,
  jsonError,
} from "@/lib/api-utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const VALID_TRIGGERS = [
  "deal_stage_changed",
  "deal_created",
  "task_overdue",
  "contact_created",
] as const;

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;

  const { data, error } = await auth.supabase
    .from("automations")
    .select("*, automation_steps(id, step_order, step_type, step_config)")
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .single();

  if (error || !data) {
    return jsonError("Automação não encontrada", 404);
  }

  return NextResponse.json(data);
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonError("JSON inválido", 400);
  }

  const updates: Record<string, unknown> = {};
  const allowedFields = [
    "name",
    "description",
    "is_active",
    "trigger_type",
    "trigger_config",
  ];

  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field];
    }
  }

  if (
    "trigger_type" in updates &&
    !VALID_TRIGGERS.includes(updates.trigger_type as (typeof VALID_TRIGGERS)[number])
  ) {
    return jsonError("Gatilho inválido", 400);
  }

  if ("name" in updates) {
    const name = (updates.name as string | undefined)?.toString().trim();
    if (!name) return jsonError("Nome é obrigatório", 400);
    updates.name = name;
  }

  const { data, error } = await auth.supabase
    .from("automations")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .select("*, automation_steps(id, step_order, step_type, step_config)")
    .single();

  if (error) {
    return jsonError(error.message, 500);
  }

  if (!data) {
    return jsonError("Automação não encontrada", 404);
  }

  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;

  const { error } = await auth.supabase
    .from("automations")
    .delete()
    .eq("id", id)
    .eq("organization_id", auth.organizationId);

  if (error) {
    return jsonError(error.message, 500);
  }

  return new NextResponse(null, { status: 204 });
}
