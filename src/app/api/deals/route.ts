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

  const { searchParams } = req.nextUrl;
  const pipelineId = searchParams.get("pipeline_id");
  const stageId = searchParams.get("stage_id");
  const assignedToId = searchParams.get("assigned_to_id");
  const priority = searchParams.get("priority");
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || "100")));

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = auth.supabase
    .from("deals")
    .select(
      "*, contacts(id, name, email, phone), companies(id, name), pipeline_stages(id, name, \"order\")",
      { count: "exact" },
    )
    .eq("organization_id", auth.organizationId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (pipelineId) {
    query = query.eq("pipeline_id", pipelineId);
  }
  if (stageId) {
    query = query.eq("stage_id", stageId);
  }
  if (assignedToId) {
    query = query.eq("assigned_to_id", assignedToId);
  }
  if (priority && ["HIGH", "MEDIUM", "LOW"].includes(priority)) {
    query = query.eq("priority", priority);
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

  const { title, value, priority, contact_id, company_id, pipeline_id, stage_id, assigned_to_id } =
    body as {
      title?: string;
      value?: number;
      priority?: string;
      contact_id?: string;
      company_id?: string;
      pipeline_id?: string;
      stage_id?: string;
      assigned_to_id?: string;
    };

  if (!title || !title.toString().trim()) {
    return jsonError("Título é obrigatório", 400);
  }
  if (!contact_id) {
    return jsonError("Contato é obrigatório", 400);
  }
  if (!pipeline_id) {
    return jsonError("Pipeline é obrigatório", 400);
  }
  if (!stage_id) {
    return jsonError("Etapa é obrigatória", 400);
  }

  const { data, error } = await auth.supabase
    .from("deals")
    .insert({
      title: title.toString().trim(),
      value: value ?? 0,
      priority: priority && ["HIGH", "MEDIUM", "LOW"].includes(priority) ? priority : "MEDIUM",
      contact_id,
      company_id: company_id || null,
      pipeline_id,
      stage_id,
      assigned_to_id: assigned_to_id || null,
      organization_id: auth.organizationId,
    })
    .select(
      "*, contacts(id, name, email, phone), companies(id, name), pipeline_stages(id, name, \"order\")",
    )
    .single();

  if (error) {
    return jsonError(error.message, 500);
  }

  return jsonSuccess(data, 201);
}
