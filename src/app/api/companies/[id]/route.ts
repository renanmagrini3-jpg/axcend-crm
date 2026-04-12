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
    .from("companies")
    .select("*, contacts(id, name, email)")
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .single();

  if (error || !data) {
    return jsonError("Empresa não encontrada", 404);
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

  const { name, cnpj, segment, size, website } = body as {
    name?: string;
    cnpj?: string;
    segment?: string;
    size?: string;
    website?: string;
  };

  // Validate CNPJ
  if (cnpj !== undefined && cnpj) {
    const cleanCnpj = cnpj.toString().replace(/\D/g, "");
    if (cleanCnpj.length !== 14) {
      return jsonError("CNPJ deve ter 14 dígitos", 400);
    }
  }

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name.toString().trim();
  if (cnpj !== undefined) updates.cnpj = cnpj?.toString().replace(/\D/g, "") || null;
  if (segment !== undefined) updates.segment = segment?.toString().trim() || null;
  if (size !== undefined) updates.size = size?.toString().trim() || null;
  if (website !== undefined) {
    let w = website?.toString().trim() || null;
    if (w && !/^https?:\/\//i.test(w)) w = `https://${w}`;
    updates.website = w;
  }

  if (Object.keys(updates).length === 0) {
    return jsonError("Nenhum campo para atualizar", 400);
  }

  const { data, error } = await auth.supabase
    .from("companies")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .select()
    .single();

  if (error) {
    return jsonError(error.message, 500);
  }

  if (!data) {
    return jsonError("Empresa não encontrada", 404);
  }

  return jsonSuccess(data);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;

  const { error } = await auth.supabase
    .from("companies")
    .delete()
    .eq("id", id)
    .eq("organization_id", auth.organizationId);

  if (error) {
    return jsonError(error.message, 500);
  }

  return new NextResponse(null, { status: 204 });
}
