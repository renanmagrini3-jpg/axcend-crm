import { NextRequest } from "next/server";
import {
  getAuthContext,
  isErrorResponse,
  jsonError,
  jsonSuccess,
} from "@/lib/api-utils";

const DEFAULT_STAGES = [
  { name: "Prospecção", order: 1 },
  { name: "Agendamento", order: 2 },
  { name: "Reunião", order: 3 },
  { name: "Proposta", order: 4 },
  { name: "Negociação", order: 5 },
  { name: "Fechado Ganho", order: 6 },
  { name: "Fechado Perdido", order: 7 },
];

export async function GET(_req: NextRequest) {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  const { data, error } = await auth.supabase
    .from("pipelines")
    .select("*, pipeline_stages(*)")
    .eq("organization_id", auth.organizationId)
    .order("created_at", { ascending: true });

  if (error) {
    return jsonError(error.message, 500);
  }

  // Sort stages by order within each pipeline
  const pipelines = (data ?? []).map((pipeline: Record<string, unknown>) => ({
    ...pipeline,
    pipeline_stages: (
      (pipeline.pipeline_stages as Array<{ order: number }>) ?? []
    ).sort((a, b) => a.order - b.order),
  }));

  return jsonSuccess(pipelines);
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

  const { name, stages } = body as {
    name?: string;
    stages?: Array<{ name: string; order: number }>;
  };

  if (!name || !name.toString().trim()) {
    return jsonError("Nome do pipeline é obrigatório", 400);
  }

  // Create pipeline
  const { data: pipeline, error: pipelineError } = await auth.supabase
    .from("pipelines")
    .insert({
      name: name.toString().trim(),
      organization_id: auth.organizationId,
    })
    .select()
    .single();

  if (pipelineError) {
    return jsonError(pipelineError.message, 500);
  }

  // Create stages (use custom or default)
  const stageList = stages && stages.length > 0 ? stages : DEFAULT_STAGES;
  const stageInserts = stageList.map((s) => ({
    name: s.name,
    order: s.order,
    pipeline_id: pipeline.id,
  }));

  const { data: createdStages, error: stagesError } = await auth.supabase
    .from("pipeline_stages")
    .insert(stageInserts)
    .select();

  if (stagesError) {
    return jsonError(stagesError.message, 500);
  }

  return jsonSuccess(
    {
      ...pipeline,
      pipeline_stages: (createdStages ?? []).sort(
        (a: { order: number }, b: { order: number }) => a.order - b.order,
      ),
    },
    201,
  );
}
