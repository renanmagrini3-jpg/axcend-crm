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

  // Create default pipeline with 7 stages
  const { data: pipeline } = await supabase
    .from("pipelines")
    .insert({
      name: "Pipeline Comercial",
      organization_id: org.id,
    })
    .select()
    .single();

  if (pipeline) {
    const defaultStages = [
      { name: "Prospecção", order: 1 },
      { name: "Agendamento", order: 2 },
      { name: "Reunião", order: 3 },
      { name: "Proposta", order: 4 },
      { name: "Negociação", order: 5 },
      { name: "Fechado Ganho", order: 6 },
      { name: "Fechado Perdido", order: 7 },
    ];

    await supabase.from("pipeline_stages").insert(
      defaultStages.map((s) => ({
        name: s.name,
        order: s.order,
        pipeline_id: pipeline.id,
      })),
    );
  }

  return NextResponse.json({ organization_id: org.id }, { status: 201 });
}
