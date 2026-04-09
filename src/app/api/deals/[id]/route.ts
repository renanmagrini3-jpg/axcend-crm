import { NextRequest, NextResponse } from "next/server";
import {
  getAuthContext,
  isErrorResponse,
  jsonError,
  jsonSuccess,
} from "@/lib/api-utils";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;

  const { data, error } = await auth.supabase
    .from("deals")
    .select(
      "*, contacts(id, name, email, phone), companies(id, name), pipeline_stages(id, name, \"order\")",
    )
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .single();

  if (error || !data) {
    return jsonError("Deal não encontrado", 404);
  }

  return jsonSuccess(data);
}

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

  const allowedFields = [
    "title",
    "value",
    "priority",
    "contact_id",
    "company_id",
    "pipeline_id",
    "stage_id",
    "assigned_to_id",
    "loss_reason",
    "closed_at",
  ];

  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return jsonError("Nenhum campo para atualizar", 400);
  }

  const { data, error } = await auth.supabase
    .from("deals")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .select(
      "*, contacts(id, name, email, phone), companies(id, name), pipeline_stages(id, name, \"order\")",
    )
    .single();

  if (error) {
    return jsonError(error.message, 500);
  }

  if (!data) {
    return jsonError("Deal não encontrado", 404);
  }

  return jsonSuccess(data);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;

  const { error } = await auth.supabase
    .from("deals")
    .delete()
    .eq("id", id)
    .eq("organization_id", auth.organizationId);

  if (error) {
    return jsonError(error.message, 500);
  }

  return new NextResponse(null, { status: 204 });
}
