"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  ChevronDown,
  Filter,
} from "lucide-react";
import { PageContainer } from "@/components/layout";
import { Button } from "@/components/ui";
import { PipelineBoard, type StageData, type DealCardData } from "@/components/data";
import { cn } from "@/lib/cn";
import type { Priority } from "@/types";

// --- Mock Data ---

const stages: StageData[] = [
  { id: "stage-1", name: "Prospecção", order: 1 },
  { id: "stage-2", name: "Agendamento", order: 2 },
  { id: "stage-3", name: "Reunião", order: 3 },
  { id: "stage-4", name: "Proposta", order: 4 },
  { id: "stage-5", name: "Negociação", order: 5 },
  { id: "stage-6", name: "Fechado Ganho", order: 6 },
  { id: "stage-7", name: "Fechado Perdido", order: 7 },
];

const sellers = ["Ana Silva", "Carlos Souza", "Marina Santos"];

const mockDeals: Record<string, DealCardData[]> = {
  "stage-1": [
    {
      id: "deal-1",
      title: "ERP Integração - TechCorp",
      value: 45000,
      priority: "HIGH",
      contactName: "João Mendes",
      companyName: "TechCorp",
      assigneeName: "Ana Silva",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      id: "deal-2",
      title: "Consultoria Digital",
      value: 12000,
      priority: "LOW",
      contactName: "Maria Lima",
      companyName: "StartupXYZ",
      assigneeName: "Carlos Souza",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  ],
  "stage-2": [
    {
      id: "deal-3",
      title: "Plataforma SaaS",
      value: 89000,
      priority: "HIGH",
      contactName: "Pedro Alves",
      companyName: "Global Ind.",
      assigneeName: "Ana Silva",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  ],
  "stage-3": [
    {
      id: "deal-4",
      title: "Automação de Marketing",
      value: 32000,
      priority: "MEDIUM",
      contactName: "Carla Rocha",
      companyName: "MediaPlus",
      assigneeName: "Marina Santos",
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
    {
      id: "deal-5",
      title: "CRM Enterprise",
      value: 156000,
      priority: "HIGH",
      contactName: "Roberto Nunes",
      companyName: "Banco Nacional",
      assigneeName: "Ana Silva",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  ],
  "stage-4": [
    {
      id: "deal-6",
      title: "Migração Cloud",
      value: 67000,
      priority: "MEDIUM",
      contactName: "Fernanda Costa",
      companyName: "LogTech",
      assigneeName: "Carlos Souza",
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    },
  ],
  "stage-5": [
    {
      id: "deal-7",
      title: "Treinamento Equipe",
      value: 18000,
      priority: "LOW",
      contactName: "Lucas Ribeiro",
      companyName: "EduTech",
      assigneeName: "Marina Santos",
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    },
  ],
  "stage-6": [
    {
      id: "deal-8",
      title: "Licença Anual Software",
      value: 24000,
      priority: "MEDIUM",
      contactName: "Juliana Pires",
      companyName: "FastRetail",
      assigneeName: "Ana Silva",
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
  ],
  "stage-7": [],
};

// --- Filters ---

const priorities: { value: Priority | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todas" },
  { value: "HIGH", label: "Alta" },
  { value: "MEDIUM", label: "Média" },
  { value: "LOW", label: "Baixa" },
];

export default function PipelinePage() {
  const [filterSeller, setFilterSeller] = useState<string>("ALL");
  const [filterPriority, setFilterPriority] = useState<Priority | "ALL">("ALL");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filteredDeals = useMemo(() => {
    const result: Record<string, DealCardData[]> = {};
    for (const stageId of Object.keys(mockDeals)) {
      result[stageId] = mockDeals[stageId].filter((deal) => {
        if (filterSeller !== "ALL" && deal.assigneeName !== filterSeller)
          return false;
        if (filterPriority !== "ALL" && deal.priority !== filterPriority)
          return false;
        return true;
      });
    }
    return result;
  }, [filterSeller, filterPriority]);

  return (
    <PageContainer title="Pipeline" description="Gerencie seus deals em tempo real">
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Pipeline selector */}
        <div className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)]">
          <span className="font-medium">Pipeline Comercial</span>
          <ChevronDown size={16} className="text-[var(--text-muted)]" />
        </div>

        <div className="flex-1" />

        {/* Filter toggle */}
        <Button
          variant="secondary"
          size="sm"
          icon={<Filter size={14} />}
          onClick={() => setFiltersOpen((p) => !p)}
        >
          Filtros
        </Button>

        <Button variant="primary" size="sm" icon={<Plus size={16} />}>
          Novo Deal
        </Button>
      </div>

      {/* Filters bar */}
      {filtersOpen && (
        <div className="mb-4 flex flex-wrap gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-3">
          {/* Seller filter */}
          <div>
            <label className="mb-1 block text-xs text-[var(--text-muted)]">
              Vendedor
            </label>
            <select
              value={filterSeller}
              onChange={(e) => setFilterSeller(e.target.value)}
              className="rounded-md border border-[var(--border-default)] bg-[var(--bg-base)] px-3 py-1.5 text-sm text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none"
            >
              <option value="ALL">Todos</option>
              {sellers.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Priority filter */}
          <div>
            <label className="mb-1 block text-xs text-[var(--text-muted)]">
              Prioridade
            </label>
            <div className="flex gap-1">
              {priorities.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setFilterPriority(p.value)}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                    filterPriority === p.value
                      ? "bg-orange-500 text-white"
                      : "bg-[var(--bg-base)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Kanban board */}
      <PipelineBoard stages={stages} initialDeals={filteredDeals} />
    </PageContainer>
  );
}
