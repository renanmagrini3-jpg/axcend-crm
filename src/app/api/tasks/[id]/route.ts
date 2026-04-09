import { NextRequest, NextResponse } from "next/server";
import {
  getAuthContext,
  isErrorResponse,
  jsonError,
} from "@/lib/api-utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;

  const { data, error } = await auth.supabase
    .from("tasks")
    .select("*, contacts(id, name)")
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .single();

  if (error || !data) {
    return jsonError("Tarefa não encontrada", 404);
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

  const allowedFields = ["title", "type", "priority", "status", "due_at", "contact_id", "deal_id", "notes", "assigned_to_id"];
  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field];
    }
  }

  // Auto-set completed_at when status changes to COMPLETED
  if (updates.status === "COMPLETED") {
    updates.completed_at = new Date().toISOString();
  } else if (updates.status && updates.status !== "COMPLETED") {
    updates.completed_at = null;
  }

  const { data, error } = await auth.supabase
    .from("tasks")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .select("*, contacts(id, name)")
    .single();

  if (error) {
    return jsonError(error.message, 500);
  }

  if (!data) {
    return jsonError("Tarefa não encontrada", 404);
  }

  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;

  const { error } = await auth.supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("organization_id", auth.organizationId);

  if (error) {
    return jsonError(error.message, 500);
  }

  return new NextResponse(null, { status: 204 });
}
