"use client";

import { useState, useMemo } from "react";
import { Plus, Upload, Download, Search } from "lucide-react";
import { PageContainer } from "@/components/layout";
import { Button, Badge } from "@/components/ui";
import { DataTable, type Column } from "@/components/data";

// --- Types ---

type LeadSource =
  | "Facebook Ads"
  | "Google Ads"
  | "Indicação"
  | "Orgânico"
  | "LinkedIn";

interface ContactRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  source: LeadSource;
  createdAt: Date;
}

// --- Badge variant map ---

const sourceVariant: Record<LeadSource, "info" | "success" | "warning" | "default"> = {
  "Facebook Ads": "info",
  "Google Ads": "warning",
  "Indicação": "success",
  "Orgânico": "default",
  "LinkedIn": "info",
};

// --- Mock Data ---

const mockContacts: ContactRow[] = [
  {
    id: "c1",
    name: "João Mendes",
    email: "joao.mendes@techcorp.com.br",
    phone: "(11) 99812-3456",
    company: "TechCorp",
    source: "Google Ads",
    createdAt: new Date("2026-03-15"),
  },
  {
    id: "c2",
    name: "Maria Lima",
    email: "maria.lima@startupxyz.io",
    phone: "(21) 98745-6789",
    company: "StartupXYZ",
    source: "LinkedIn",
    createdAt: new Date("2026-03-20"),
  },
  {
    id: "c3",
    name: "Pedro Alves",
    email: "pedro@globalind.com.br",
    phone: "(11) 97632-1098",
    company: "Global Ind.",
    source: "Indicação",
    createdAt: new Date("2026-02-28"),
  },
  {
    id: "c4",
    name: "Carla Rocha",
    email: "carla.rocha@mediaplus.com",
    phone: "(31) 99456-7890",
    company: "MediaPlus",
    source: "Facebook Ads",
    createdAt: new Date("2026-03-05"),
  },
  {
    id: "c5",
    name: "Roberto Nunes",
    email: "roberto.nunes@banconacional.com.br",
    phone: "(11) 98123-4567",
    company: "Banco Nacional",
    source: "Orgânico",
    createdAt: new Date("2026-01-18"),
  },
  {
    id: "c6",
    name: "Fernanda Costa",
    email: "fernanda@logtech.com.br",
    phone: "(41) 99234-5678",
    company: "LogTech",
    source: "Google Ads",
    createdAt: new Date("2026-03-22"),
  },
  {
    id: "c7",
    name: "Lucas Ribeiro",
    email: "lucas.ribeiro@edutech.com.br",
    phone: "(51) 98765-4321",
    company: "EduTech",
    source: "LinkedIn",
    createdAt: new Date("2026-02-10"),
  },
  {
    id: "c8",
    name: "Juliana Pires",
    email: "juliana@fastretail.com.br",
    phone: "(19) 99345-6789",
    company: "FastRetail",
    source: "Indicação",
    createdAt: new Date("2026-03-28"),
  },
  {
    id: "c9",
    name: "André Santos",
    email: "andre.santos@novadata.com.br",
    phone: "(48) 99876-5432",
    company: "NovaData",
    source: "Facebook Ads",
    createdAt: new Date("2026-04-01"),
  },
  {
    id: "c10",
    name: "Beatriz Oliveira",
    email: "beatriz@solarenergy.com.br",
    phone: "(62) 98654-3210",
    company: "Solar Energy",
    source: "Orgânico",
    createdAt: new Date("2026-03-10"),
  },
];

// --- Columns ---

const columns: Column<ContactRow>[] = [
  { key: "name", label: "Nome" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Telefone", sortable: false },
  { key: "company", label: "Empresa" },
  {
    key: "source",
    label: "Origem",
    render: (row) => (
      <Badge variant={sourceVariant[row.source]} size="sm">
        {row.source}
      </Badge>
    ),
  },
  {
    key: "createdAt",
    label: "Criado em",
    render: (row) =>
      row.createdAt.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
  },
];

// --- Page ---

export default function ContactsPage() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return mockContacts;
    const q = search.toLowerCase();
    return mockContacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q),
    );
  }, [search]);

  return (
    <PageContainer title="Contatos" description="Gerencie sua base de contatos">
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          />
          <input
            type="text"
            placeholder="Buscar contato..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] pl-9 pr-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-focus)] focus:outline-none transition-colors"
          />
        </div>

        <div className="flex-1" />

        <Button variant="secondary" size="sm" icon={<Download size={14} />}>
          Exportar
        </Button>
        <Button variant="secondary" size="sm" icon={<Upload size={14} />}>
          Importar CSV
        </Button>
        <Button variant="primary" size="sm" icon={<Plus size={16} />}>
          Novo Contato
        </Button>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filtered}
        onRowClick={(row) => setSelectedId(row.id === selectedId ? null : row.id)}
        selectedId={selectedId}
      />
    </PageContainer>
  );
}
