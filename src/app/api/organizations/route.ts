import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // Check if user already has an organization
  const existingOrgId = user.user_metadata?.organization_id;
  if (existingOrgId) {
    return NextResponse.json({ organization_id: existingOrgId }, { status: 200 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { name, mode } = body as { name?: string; mode?: string };

  if (!name || !name.toString().trim()) {
    return NextResponse.json(
      { error: "Nome da organização é obrigatório" },
      { status: 400 },
    );
  }

  // Generate slug from name
  const slug = name
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    + "-" + Date.now().toString(36);

  // Use SECURITY DEFINER RPC to bypass RLS during onboarding.
  // New users have no organization_id in their JWT yet, so normal
  // INSERT/SELECT policies on organizations, pipelines, etc. all fail.
  const { data: result, error: rpcError } = await supabase.rpc(
    "onboard_create_organization",
    {
      p_name: name.toString().trim(),
      p_slug: slug,
      p_mode: mode === "B2C" ? "B2C" : "B2B",
    },
  );

  if (rpcError) {
    return NextResponse.json({ error: rpcError.message }, { status: 500 });
  }

  const orgId = result.organization_id;

  // Update user metadata with organization_id so future JWTs include it
  const { error: updateError } = await supabase.auth.updateUser({
    data: { organization_id: orgId },
  });

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ organization_id: orgId }, { status: 201 });
}
