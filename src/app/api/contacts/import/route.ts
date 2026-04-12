import { NextRequest, NextResponse } from "next/server";
import {
  getAuthContext,
  isErrorResponse,
  jsonError,
} from "@/lib/api-utils";

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === "," || ch === ";") {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/^["']|["']$/g, ""));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });
    rows.push(row);
  }

  return rows;
}

const FIELD_MAP: Record<string, string> = {
  nome: "name",
  name: "name",
  email: "email",
  "e-mail": "email",
  telefone: "phone",
  phone: "phone",
  cargo: "position",
  position: "position",
  origem: "origin",
  origin: "origin",
  source: "origin",
};

export async function POST(req: NextRequest) {
  const auth = await getAuthContext();
  if (isErrorResponse(auth)) return auth;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return jsonError("Arquivo CSV é obrigatório", 400);
  }

  const text = await file.text();
  const rows = parseCSV(text);

  if (rows.length === 0) {
    return jsonError("Arquivo CSV vazio ou inválido", 400);
  }

  const contacts = rows
    .map((row) => {
      const mapped: Record<string, string> = {};
      for (const [key, value] of Object.entries(row)) {
        const normalizedKey = FIELD_MAP[key];
        if (normalizedKey && value) {
          mapped[normalizedKey] = value;
        }
      }
      return mapped;
    })
    .filter((c) => c.name?.trim())
    .map((c) => ({
      name: c.name.trim(),
      email: c.email?.trim() || null,
      phone: c.phone?.trim() || null,
      position: c.position?.trim() || null,
      origin: c.origin?.trim() || null,
      organization_id: auth.organizationId,
    }));

  if (contacts.length === 0) {
    return jsonError("Nenhum contato válido encontrado no CSV", 400);
  }

  const { data, error } = await auth.supabase
    .from("contacts")
    .insert(contacts)
    .select();

  if (error) {
    return jsonError(error.message, 500);
  }

  return NextResponse.json(
    { imported: data?.length ?? 0, data },
    { status: 201 },
  );
}
