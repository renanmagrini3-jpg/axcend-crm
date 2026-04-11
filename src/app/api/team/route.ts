import { NextRequest } from "next/server";
import {
  getAuthContext,
  isErrorResponse,
  jsonError,
  jsonSuccess,
} from "@/lib/api-utils";

const VALID_ROLES = new Set(["admin", "manager", "seller"]);

export async function GET(_req: NextRequest) {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  const { data, error } = await auth.supabase
    .from("organization_members")
    .select("id, user_id, name, email, role, invited_at, joined_at, created_at")
    .eq("organization_id", auth.organizationId)
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

  const { name, email, role } = body as {
    name?: string;
    email?: string;
    role?: string;
  };

  if (!name || !name.toString().trim()) {
    return jsonError("Nome é obrigatório", 400);
  }
  if (!email || !email.toString().trim()) {
    return jsonError("Email é obrigatório", 400);
  }
  const finalRole = (role ?? "seller").toString();
  if (!VALID_ROLES.has(finalRole)) {
    return jsonError("Role inválida (admin, manager ou seller)", 400);
  }

  const { data, error } = await auth.supabase
    .from("organization_members")
    .insert({
      name: name.toString().trim(),
      email: email.toString().trim().toLowerCase(),
      role: finalRole,
      organization_id: auth.organizationId,
      invited_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return jsonError("Este email já foi convidado", 409);
    }
    return jsonError(error.message, 500);
  }

  return jsonSuccess(data, 201);
}
