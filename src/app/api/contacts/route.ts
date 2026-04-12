import { NextRequest, NextResponse } from "next/server";
import {
  getAuthContext,
  isErrorResponse,
  jsonError,
  jsonSuccess,
} from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search") || "";
  const origin = searchParams.get("origin") || "";
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || "20")));
  const sortBy = searchParams.get("sortBy") || "created_at";
  const order = searchParams.get("order") === "asc" ? true : false;

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = auth.supabase
    .from("contacts")
    .select("*, companies(id, name), deals(id)", { count: "exact" })
    .eq("organization_id", auth.organizationId)
    .order(sortBy, { ascending: order })
    .range(from, to);

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,email.ilike.%${search}%`,
    );
  }
  if (origin) {
    query = query.eq("origin", origin);
  }

  const { data, error, count } = await query;

  if (error) {
    return jsonError(error.message, 500);
  }

  return jsonSuccess({
    data,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  });
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

  const { name, email, phone, position, company_id, origin } = body as {
    name?: string;
    email?: string;
    phone?: string;
    position?: string;
    company_id?: string;
    origin?: string;
  };

  if (!name || !name.toString().trim()) {
    return jsonError("Nome é obrigatório", 400);
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.toString().trim())) {
    return jsonError("E-mail inválido", 400);
  }

  if (phone && !/^[\d\s()+\-\.]+$/.test(phone.toString().trim())) {
    return jsonError("Telefone inválido. Use apenas números, parênteses, hífens e +", 400);
  }

  // Duplicate detection
  if (email?.trim()) {
    const { data: existing } = await auth.supabase
      .from("contacts")
      .select("id")
      .eq("organization_id", auth.organizationId)
      .eq("email", email.toString().trim())
      .limit(1);
    if (existing && existing.length > 0) {
      return jsonError("Contato com este e-mail já existe", 409);
    }
  }
  if (phone?.trim()) {
    const { data: existing } = await auth.supabase
      .from("contacts")
      .select("id")
      .eq("organization_id", auth.organizationId)
      .eq("phone", phone.toString().trim())
      .limit(1);
    if (existing && existing.length > 0) {
      return jsonError("Contato com este telefone já existe", 409);
    }
  }

  const { data, error } = await auth.supabase
    .from("contacts")
    .insert({
      name: name.toString().trim(),
      email: email?.toString().trim() || null,
      phone: phone?.toString().trim() || null,
      position: position?.toString().trim() || null,
      company_id: company_id || null,
      organization_id: auth.organizationId,
      origin: origin?.toString().trim() || null,
    })
    .select("*, companies(id, name)")
    .single();

  if (error) {
    return jsonError(error.message, 500);
  }

  return NextResponse.json(data, { status: 201 });
}
