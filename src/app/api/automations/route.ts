import { NextRequest, NextResponse } from "next/server";
import {
  getAuthContext,
  isErrorResponse,
  jsonError,
  jsonSuccess,
} from "@/lib/api-utils";

const VALID_TRIGGERS = [
  "deal_stage_changed",
  "deal_created",
  "task_overdue",
  "contact_created",
] as const;

const VALID_STEP_TYPES = [
  "send_notification",
  "create_task",
  "move_deal",
  "update_field",
  "wait",
] as const;

type TriggerType = (typeof VALID_TRIGGERS)[number];
type StepType = (typeof VALID_STEP_TYPES)[number];

interface StepInput {
  step_order: number;
  step_type: StepType;
  step_config?: Record<string, unknown>;
}

export async function GET(req: NextRequest) {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search") || "";
  const isActive = searchParams.get("is_active");
  const triggerType = searchParams.get("trigger_type") || "";
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || "50")));
  const sortBy = searchParams.get("sortBy") || "created_at";
  const order = searchParams.get("order") === "asc" ? true : false;

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = auth.supabase
    .from("automations")
    .select("*, automation_steps(id, step_order, step_type, step_config)", { count: "exact" })
    .eq("organization_id", auth.organizationId)
    .order(sortBy, { ascending: order })
    .range(from, to);

  if (isActive === "true") query = query.eq("is_active", true);
  if (isActive === "false") query = query.eq("is_active", false);
  if (triggerType) query = query.eq("trigger_type", triggerType);
  if (search) query = query.ilike("name", `%${search}%`);

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

  const {
    name,
    description,
    is_active,
    trigger_type,
    trigger_config,
    steps,
  } = body as {
    name?: string;
    description?: string;
    is_active?: boolean;
    trigger_type?: string;
    trigger_config?: Record<string, unknown>;
    steps?: StepInput[];
  };

  if (!name || !name.toString().trim()) {
    return jsonError("Nome é obrigatório", 400);
  }

  if (!trigger_type || !VALID_TRIGGERS.includes(trigger_type as TriggerType)) {
    return jsonError("Gatilho inválido", 400);
  }

  const { data: automation, error: insertError } = await auth.supabase
    .from("automations")
    .insert({
      name: name.toString().trim(),
      description: description?.toString().trim() || null,
      is_active: Boolean(is_active),
      trigger_type,
      trigger_config: trigger_config ?? {},
      organization_id: auth.organizationId,
      created_by: auth.userId,
    })
    .select("*")
    .single();

  if (insertError || !automation) {
    return jsonError(insertError?.message || "Erro ao criar automação", 500);
  }

  if (Array.isArray(steps) && steps.length > 0) {
    const invalidStep = steps.find(
      (s) => !VALID_STEP_TYPES.includes(s.step_type),
    );
    if (invalidStep) {
      await auth.supabase.from("automations").delete().eq("id", automation.id);
      return jsonError("Tipo de passo inválido", 400);
    }

    const stepsPayload = steps.map((s) => ({
      automation_id: automation.id,
      step_order: s.step_order,
      step_type: s.step_type,
      step_config: s.step_config ?? {},
    }));

    const { error: stepsError } = await auth.supabase
      .from("automation_steps")
      .insert(stepsPayload);

    if (stepsError) {
      await auth.supabase.from("automations").delete().eq("id", automation.id);
      return jsonError(stepsError.message, 500);
    }
  }

  const { data: full } = await auth.supabase
    .from("automations")
    .select("*, automation_steps(id, step_order, step_type, step_config)")
    .eq("id", automation.id)
    .single();

  return NextResponse.json(full ?? automation, { status: 201 });
}
