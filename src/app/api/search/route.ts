import { NextRequest } from "next/server";
import {
  getAuthContext,
  isErrorResponse,
  jsonSuccess,
} from "@/lib/api-utils";
import { sanitizeSearch } from "@/lib/sanitize";

export async function GET(req: NextRequest) {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  const raw = req.nextUrl.searchParams.get("q")?.trim();
  if (!raw || raw.length < 2) {
    return jsonSuccess({ deals: [], contacts: [], companies: [] });
  }

  const q = sanitizeSearch(raw);
  const orgId = auth.organizationId;
  const pattern = `%${q}%`;

  const [dealsRes, contactsRes, companiesRes] = await Promise.all([
    auth.supabase
      .from("deals")
      .select("id, title, value")
      .eq("organization_id", orgId)
      .ilike("title", pattern)
      .limit(5),
    auth.supabase
      .from("contacts")
      .select("id, name, email")
      .eq("organization_id", orgId)
      .or(`name.ilike.${pattern},email.ilike.${pattern}`)
      .limit(5),
    auth.supabase
      .from("companies")
      .select("id, name")
      .eq("organization_id", orgId)
      .ilike("name", pattern)
      .limit(5),
  ]);

  return jsonSuccess({
    deals: dealsRes.data ?? [],
    contacts: contactsRes.data ?? [],
    companies: companiesRes.data ?? [],
  });
}
