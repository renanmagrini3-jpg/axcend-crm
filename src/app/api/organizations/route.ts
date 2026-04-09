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

  // Create organization using service role to bypass RLS for initial insert
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: name.toString().trim(),
      slug,
      mode: mode === "B2C" ? "B2C" : "B2B",
    })
    .select()
    .single();

  if (orgError) {
    return NextResponse.json({ error: orgError.message }, { status: 500 });
  }

  // Update user metadata with organization_id
  const { error: updateError } = await supabase.auth.updateUser({
    data: { organization_id: org.id },
  });

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ organization_id: org.id }, { status: 201 });
}
