import { NextRequest, NextResponse } from "next/server";
import {
  getAuthContext,
  isErrorResponse,
  jsonError,
  jsonSuccess,
} from "@/lib/api-utils";

type Params = { params: Promise<{ id: string }> };

const BUCKET = "deal-attachments";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function GET(_req: NextRequest, { params }: Params) {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  const { id: dealId } = await params;

  const { data, error } = await auth.supabase
    .from("deal_attachments")
    .select("id, deal_id, file_name, file_path, file_size, uploaded_by, created_at")
    .eq("deal_id", dealId)
    .eq("organization_id", auth.organizationId)
    .order("created_at", { ascending: false });

  if (error) return jsonError(error.message, 500);

  return jsonSuccess(data ?? []);
}

export async function POST(req: NextRequest, { params }: Params) {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  const { id: dealId } = await params;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return jsonError("Envie um arquivo via multipart/form-data", 400);
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return jsonError("Arquivo é obrigatório", 400);
  }

  if (file.size > MAX_FILE_SIZE) {
    return jsonError("Arquivo deve ter no máximo 10MB", 400);
  }

  // Build storage path: orgId/dealId/timestamp-filename
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${auth.organizationId}/${dealId}/${timestamp}-${safeName}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await auth.supabase.storage
    .from(BUCKET)
    .upload(filePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    return jsonError(uploadError.message, 500);
  }

  // Save metadata to database
  const { data, error: dbError } = await auth.supabase
    .from("deal_attachments")
    .insert({
      deal_id: dealId,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      uploaded_by: auth.userId,
      organization_id: auth.organizationId,
    })
    .select()
    .single();

  if (dbError) {
    // Rollback: remove uploaded file
    await auth.supabase.storage.from(BUCKET).remove([filePath]);
    return jsonError(dbError.message, 500);
  }

  return jsonSuccess(data, 201);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  const { id: dealId } = await params;
  const attachmentId = req.nextUrl.searchParams.get("attachment_id");

  if (!attachmentId) {
    return jsonError("attachment_id é obrigatório", 400);
  }

  // Fetch the attachment to get file_path
  const { data: attachment, error: fetchError } = await auth.supabase
    .from("deal_attachments")
    .select("id, file_path")
    .eq("id", attachmentId)
    .eq("deal_id", dealId)
    .eq("organization_id", auth.organizationId)
    .single();

  if (fetchError || !attachment) {
    return jsonError("Anexo não encontrado", 404);
  }

  // Delete from storage
  await auth.supabase.storage.from(BUCKET).remove([attachment.file_path]);

  // Delete from database
  const { error: deleteError } = await auth.supabase
    .from("deal_attachments")
    .delete()
    .eq("id", attachmentId)
    .eq("organization_id", auth.organizationId);

  if (deleteError) return jsonError(deleteError.message, 500);

  return new NextResponse(null, { status: 204 });
}
