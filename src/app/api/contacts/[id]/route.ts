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
    .from("contacts")
    .select("*, companies(id, name)")
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .single();

  if (error || !data) {
    return jsonError("Contato não encontrado", 404);
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

  const { name, email, phone, position, company_id, origin } = body as {
    name?: string;
    email?: string;
    phone?: string;
    position?: string;
    company_id?: string | null;
    origin?: string;
  };

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name.toString().trim();
  if (email !== undefined) updates.email = email?.toString().trim() || null;
  if (phone !== undefined) updates.phone = phone?.toString().trim() || null;
  if (position !== undefined) updates.position = position?.toString().trim() || null;
  if (company_id !== undefined) updates.company_id = company_id || null;
  if (origin !== undefined) updates.origin = origin?.toString().trim() || null;

  if (Object.keys(updates).length === 0) {
    return jsonError("Nenhum campo para atualizar", 400);
  }

  const { data, error } = await auth.supabase
    .from("contacts")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .select("*, companies(id, name)")
    .single();

  if (error) {
    return jsonError(error.message, 500);
  }

  if (!data) {
    return jsonError("Contato não encontrado", 404);
  }

  return jsonSuccess(data);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;

  const { error } = await auth.supabase
    .from("contacts")
    .delete()
    .eq("id", id)
    .eq("organization_id", auth.organizationId);

  if (error) {
    return jsonError(error.message, 500);
  }

  return new NextResponse(null, { status: 204 });
}
