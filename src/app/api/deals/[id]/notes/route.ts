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

  const { data: deal, error: dealError } = await auth.supabase
    .from("deals")
    .select("id")
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .single();

  if (dealError || !deal) {
    return jsonError("Deal não encontrado", 404);
  }

  const { data, error } = await auth.supabase
    .from("deal_notes")
    .select("id, deal_id, content, author_id, author_name, created_at")
    .eq("deal_id", id)
    .eq("organization_id", auth.organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    return jsonError(error.message, 500);
  }

  return jsonSuccess({ data: data ?? [] });
}

export async function POST(req: NextRequest, { params }: Params) {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonError("JSON inválido", 400);
  }

  const { content } = body as { content?: string };

  if (!content || !content.toString().trim()) {
    return jsonError("Conteúdo é obrigatório", 400);
  }

  const { data: deal, error: dealError } = await auth.supabase
    .from("deals")
    .select("id")
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .single();

  if (dealError || !deal) {
    return jsonError("Deal não encontrado", 404);
  }

  const {
    data: { user },
  } = await auth.supabase.auth.getUser();

  const authorName =
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email ||
    null;

  const { data, error } = await auth.supabase
    .from("deal_notes")
    .insert({
      deal_id: id,
      content: content.toString().trim(),
      author_id: auth.userId,
      author_name: authorName,
      organization_id: auth.organizationId,
    })
    .select("id, deal_id, content, author_id, author_name, created_at")
    .single();

  if (error) {
    return jsonError(error.message, 500);
  }

  return NextResponse.json(data, { status: 201 });
}
