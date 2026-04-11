import { NextRequest } from "next/server";
import {
  getAuthContext,
  isErrorResponse,
  jsonError,
  jsonSuccess,
} from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  const activeParam = req.nextUrl.searchParams.get("active");

  let query = auth.supabase
    .from("task_types")
    .select("*")
    .eq("organization_id", auth.organizationId)
    .order("created_at", { ascending: true });

  if (activeParam === "true") {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

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

  const { name, icon } = body as { name?: string; icon?: string };
  if (!name || !name.toString().trim()) {
    return jsonError("Nome é obrigatório", 400);
  }

  const { data, error } = await auth.supabase
    .from("task_types")
    .insert({
      name: name.toString().trim(),
      icon: icon?.toString().trim() || null,
      organization_id: auth.organizationId,
    })
    .select()
    .single();

  if (error) return jsonError(error.message, 500);

  return jsonSuccess(data, 201);
}
