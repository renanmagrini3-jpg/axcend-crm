"use client";

import { useState, useMemo } from "react";
import { Plus, Search } from "lucide-react";
import { PageContainer } from "@/components/layout";
import { Button, Badge } from "@/components/ui";
import { DataTable, type Column } from "@/components/data";

// --- Types ---

type CompanySize = "Pequena" | "Média" | "Grande";

interface CompanyRow {
  id: string;
  name: string;
  cnpj: string;
  segment: string;
  size: CompanySize;
  contactCount: number;
  createdAt: Date;
}

// --- Badge variant map ---

const sizeVariant: Record<CompanySize, "default" | "info" | "success"> = {
  Pequena: "default",
  Média: "info",
  Grande: "success",
};

// --- Mock Data ---

const mockCompanies: CompanyRow[] = [
  {
    id: "co1",
    name: "TechCorp",
    cnpj: "12.345.678/0001-90",
    segment: "Tecnologia",
    size: "Grande",
    contactCount: 4,
    createdAt: new Date("2026-01-10"),
  },
  {
    id: "co2",
    name: "StartupXYZ",
    cnpj: "98.765.432/0001-10",
    segment: "SaaS",
    size: "Pequena",
    contactCount: 2,
    createdAt: new Date("2026-02-05"),
  },
  {
    id: "co3",
    name: "Global Ind.",
    cnpj: "45.678.901/0001-23",
    segment: "Indústria",
    size: "Grande",
    contactCount: 6,
    createdAt: new Date("2025-11-20"),
  },
  {
    id: "co4",
    name: "MediaPlus",
    cnpj: "34.567.890/0001-45",
    segment: "Marketing",
    size: "Média",
    contactCount: 3,
    createdAt: new Date("2026-03-01"),
  },
  {
    id: "co5",
    name: "LogTech",
    cnpj: "56.789.012/0001-67",
    segment: "Logística",
    size: "Média",
    contactCount: 2,
    createdAt: new Date("2026-03-15"),
  },
];

// --- Columns ---

const columns: Column<CompanyRow>[] = [
  { key: "name", label: "Nome" },
  { key: "cnpj", label: "CNPJ", sortable: false },
  { key: "segment", label: "Segmento" },
  {
    key: "size",
    label: "Tamanho",
    render: (row) => (
      <Badge variant={sizeVariant[row.size]} size="sm">
        {row.size}
      </Badge>
    ),
  },
  {
    key: "contactCount",
    label: "Contatos",
    render: (row) => (
      <span className="font-mono text-[var(--text-secondary)]">
        {row.contactCount}
      </span>
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

export default function CompaniesPage() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return mockCompanies;
    const q = search.toLowerCase();
    return mockCompanies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.cnpj.includes(q) ||
        c.segment.toLowerCase().includes(q),
    );
  }, [search]);

  return (
    <PageContainer title="Empresas" description="Gerencie suas empresas clientes">
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
            placeholder="Buscar empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] pl-9 pr-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-focus)] focus:outline-none transition-colors"
          />
        </div>

        <div className="flex-1" />

        <Button variant="primary" size="sm" icon={<Plus size={16} />}>
          Nova Empresa
        </Button>
      </div>

      {/* Table */}
      <DataTable columns={columns} data={filtered} />
    </PageContainer>
  );
}
