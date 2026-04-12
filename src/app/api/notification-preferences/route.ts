import { NextRequest } from "next/server";
import {
  getAuthContext,
  isErrorResponse,
  jsonError,
  jsonSuccess,
} from "@/lib/api-utils";

const BOOLEAN_FIELDS = [
  "notify_deal_assigned",
  "notify_deal_stage_changed",
  "notify_task_due",
  "notify_task_overdue",
  "notify_new_contact",
  "notify_deal_won",
  "notify_deal_lost",
  "email_notifications",
  "browser_notifications",
] as const;

const DEFAULTS: Record<string, boolean> = {
  notify_deal_assigned: true,
  notify_deal_stage_changed: true,
  notify_task_due: true,
  notify_task_overdue: true,
  notify_new_contact: false,
  notify_deal_won: true,
  notify_deal_lost: true,
  email_notifications: true,
  browser_notifications: false,
};

export async function GET() {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  const { data, error } = await auth.supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", auth.userId)
    .eq("organization_id", auth.organizationId)
    .single();

  if (error && error.code !== "PGRST116") {
    return jsonError(error.message, 500);
  }

  // Return defaults if no row exists yet
  if (!data) {
    return jsonSuccess({
      ...DEFAULTS,
      user_id: auth.userId,
      organization_id: auth.organizationId,
    });
  }

  return jsonSuccess(data);
}

export async function PUT(req: NextRequest) {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonError("JSON inválido", 400);
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  for (const field of BOOLEAN_FIELDS) {
    if (body[field] !== undefined) {
      updates[field] = !!body[field];
    }
  }

  // Upsert: try update first, insert if no row
  const { data: existing } = await auth.supabase
    .from("notification_preferences")
    .select("id")
    .eq("user_id", auth.userId)
    .eq("organization_id", auth.organizationId)
    .single();

  if (existing) {
    const { data, error } = await auth.supabase
      .from("notification_preferences")
      .update(updates)
      .eq("id", existing.id)
      .select()
      .single();

    if (error) return jsonError(error.message, 500);
    return jsonSuccess(data);
  }

  // Insert with defaults merged
  const insertRow: Record<string, unknown> = {
    user_id: auth.userId,
    organization_id: auth.organizationId,
    ...DEFAULTS,
    ...updates,
  };

  const { data, error } = await auth.supabase
    .from("notification_preferences")
    .insert(insertRow)
    .select()
    .single();

  if (error) return jsonError(error.message, 500);
  return jsonSuccess(data, 201);
}
