import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export interface AuthContext {
  userId: string;
  organizationId: string;
  supabase: Awaited<ReturnType<typeof createServerClient>>;
}

/**
 * Authenticates the request and extracts organization_id from user metadata.
 * Returns AuthContext on success, or a NextResponse error on failure.
 */
export async function getAuthContext(): Promise<AuthContext | NextResponse> {
  const supabase = await createServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { error: "Não autorizado" },
      { status: 401 },
    );
  }

  const organizationId = user.user_metadata?.organization_id as string | undefined;

  if (!organizationId) {
    return NextResponse.json(
      { error: "Organização não configurada. Complete o cadastro." },
      { status: 400 },
    );
  }

  return { userId: user.id, organizationId, supabase };
}

export function isErrorResponse(
  result: AuthContext | NextResponse,
): result is NextResponse {
  return result instanceof NextResponse;
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function jsonSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}
