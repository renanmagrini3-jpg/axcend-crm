import { NextRequest, NextResponse } from "next/server";
import {
  getAuthContext,
  isErrorResponse,
  jsonError,
  jsonSuccess,
} from "@/lib/api-utils";
import { sanitizeSearch } from "@/lib/sanitize";

export async function GET(req: NextRequest) {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const type = searchParams.get("type") || "";
  const priority = searchParams.get("priority") || "";
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";
  const dealId = searchParams.get("deal_id") || "";
  const contactId = searchParams.get("contact_id") || "";
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || "50")));
  const sortBy = searchParams.get("sortBy") || "due_at";
  const order = searchParams.get("order") === "desc" ? false : true;

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Auto-mark overdue: PENDING tasks past their due date
  await auth.supabase
    .from("tasks")
    .update({ status: "OVERDUE" })
    .eq("organization_id", auth.organizationId)
    .eq("status", "PENDING")
    .lt("due_at", new Date().toISOString());

  let query = auth.supabase
    .from("tasks")
    .select("*, contacts(id, name)", { count: "exact" })
    .eq("organization_id", auth.organizationId)
    .order(sortBy, { ascending: order })
    .range(from, to);

  if (status) query = query.eq("status", status);
  if (type) query = query.eq("type", type);
  if (priority) query = query.eq("priority", priority);
  if (dealId) query = query.eq("deal_id", dealId);
  if (contactId) query = query.eq("contact_id", contactId);
  if (dateFrom) query = query.gte("due_at", dateFrom);
  if (dateTo) query = query.lte("due_at", dateTo);

  if (search) {
    const s = sanitizeSearch(search);
    query = query.or(`title.ilike.%${s}%`);
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

  const { title, type, priority, due_at, contact_id, deal_id, notes } = body as {
    title?: string;
    type?: string;
    priority?: string;
    due_at?: string;
    contact_id?: string;
    deal_id?: string;
    notes?: string;
  };

  if (!title || !title.toString().trim()) {
    return jsonError("Título é obrigatório", 400);
  }

  if (!due_at) {
    return jsonError("Data é obrigatória", 400);
  }

  const { data, error } = await auth.supabase
    .from("tasks")
    .insert({
      title: title.toString().trim(),
      type: type || "CUSTOM",
      priority: priority || "MEDIUM",
      status: "PENDING",
      due_at,
      contact_id: contact_id || null,
      deal_id: deal_id || null,
      assigned_to_id: auth.userId,
      organization_id: auth.organizationId,
      notes: notes?.toString().trim() || null,
    })
    .select("*, contacts(id, name)")
    .single();

  if (error) {
    return jsonError(error.message, 500);
  }

  return NextResponse.json(data, { status: 201 });
}
