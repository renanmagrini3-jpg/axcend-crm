import { NextRequest, NextResponse } from "next/server";
import {
  getAuthContext,
  isErrorResponse,
  jsonError,
} from "@/lib/api-utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;

  const { data: current, error: fetchError } = await auth.supabase
    .from("automations")
    .select("id, is_active")
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .single();

  if (fetchError || !current) {
    return jsonError("Automação não encontrada", 404);
  }

  const { data, error } = await auth.supabase
    .from("automations")
    .update({ is_active: !current.is_active })
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .select("*, automation_steps(id, step_order, step_type, step_config)")
    .single();

  if (error) {
    return jsonError(error.message, 500);
  }

  return NextResponse.json(data);
}
