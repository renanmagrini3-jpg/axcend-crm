"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Plus,
  ChevronDown,
  Filter,
  Loader2,
} from "lucide-react";
import { PageContainer } from "@/components/layout";
import { Button, Modal, Input } from "@/components/ui";
import { PipelineBoard, type StageData, type DealCardData } from "@/components/data";
import { cn } from "@/lib/cn";
import type { Priority } from "@/types";

// --- Types ---

interface PipelineData {
  id: string;
  name: string;
  pipeline_stages: StageData[];
}

interface DealFromAPI {
  id: string;
  title: string;
  value: number;
  priority: Priority;
  contact_id: string;
  company_id: string | null;
  pipeline_id: string;
  stage_id: string;
  assigned_to_id: string | null;
  loss_reason: string | null;
  closed_at: string | null;
  created_at: string;
  contacts: { id: string; name: string; email: string | null; phone: string | null } | null;
  companies: { id: string; name: string } | null;
  pipeline_stages: { id: string; name: string; order: number } | null;
  organization_members: { id: string; name: string } | null;
}

interface MemberOption {
  id: string;
  name: string;
}

interface ContactOption {
  id: string;
  name: string;
  company_id: string | null;
  companies: { id: string; name: string } | null;
}

interface CompanyOption {
  id: string;
  name: string;
}

// --- Filters ---

const priorities: { value: Priority | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todas" },
  { value: "HIGH", label: "Alta" },
  { value: "MEDIUM", label: "Média" },
  { value: "LOW", label: "Baixa" },
];

function dealFromAPI(deal: DealFromAPI): DealCardData {
  return {
    id: deal.id,
    title: deal.title,
    value: Number(deal.value),
    priority: deal.priority as Priority,
    contactName: deal.contacts?.name ?? "—",
    companyName: deal.companies?.name,
    assigneeName: deal.organization_members?.name ?? "—",
    createdAt: new Date(deal.created_at),
  };
}

export default function PipelinePage() {
  // Data state
  const [pipelines, setPipelines] = useState<PipelineData[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>("");
  const [deals, setDeals] = useState<DealFromAPI[]>([]);
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [pipelineDropdownOpen, setPipelineDropdownOpen] = useState(false);

  // Filters
  const [filterPriority, setFilterPriority] = useState<Priority | "ALL">("ALL");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // New deal modal
  const [newDealOpen, setNewDealOpen] = useState(false);
  const [newDealTitle, setNewDealTitle] = useState("");
  const [newDealValue, setNewDealValue] = useState("");
  const [newDealContactId, setNewDealContactId] = useState("");
  const [newDealCompanyId, setNewDealCompanyId] = useState("");
  const [newDealPriority, setNewDealPriority] = useState<Priority>("MEDIUM");
  const [newDealAssigneeId, setNewDealAssigneeId] = useState("");
  const [newDealSubmitting, setNewDealSubmitting] = useState(false);

  const selectedPipeline = pipelines.find((p) => p.id === selectedPipelineId);

  // --- Data Fetching ---

  const fetchPipelines = useCallback(async () => {
    const res = await fetch("/api/pipelines");
    if (!res.ok) return [];
    const data = await res.json();
    return data as PipelineData[];
  }, []);

  const fetchDeals = useCallback(async (pipelineId: string) => {
    const res = await fetch(`/api/deals?pipeline_id=${pipelineId}&limit=100`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data ?? []) as DealFromAPI[];
  }, []);

  const createDefaultPipeline = useCallback(async () => {
    const res = await fetch("/api/pipelines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Pipeline Comercial" }),
    });
    if (!res.ok) return null;
    return (await res.json()) as PipelineData;
  }, []);

  // Initial load
  useEffect(() => {
    async function init() {
      setLoading(true);

      // Fetch contacts and companies in parallel
      const [contactsRes, companiesRes, membersRes] = await Promise.all([
        fetch("/api/contacts?limit=100"),
        fetch("/api/companies?limit=100"),
        fetch("/api/team"),
      ]);

      if (contactsRes.ok) {
        const cData = await contactsRes.json();
        setContacts(cData.data ?? []);
      }
      if (companiesRes.ok) {
        const coData = await companiesRes.json();
        setCompanies(coData.data ?? []);
      }
      if (membersRes.ok) {
        const mData = await membersRes.json();
        setMembers((mData as MemberOption[]) ?? []);
      }

      let pipelineList = await fetchPipelines();

      // If no pipelines, create default
      if (pipelineList.length === 0) {
        const newPipeline = await createDefaultPipeline();
        if (newPipeline) {
          pipelineList = [newPipeline];
        }
      }

      setPipelines(pipelineList);

      if (pipelineList.length > 0) {
        const firstId = pipelineList[0].id;
        setSelectedPipelineId(firstId);
        const dealList = await fetchDeals(firstId);
        setDeals(dealList);
      }

      setLoading(false);
    }
    init();
  }, [fetchPipelines, fetchDeals, createDefaultPipeline]);

  // When pipeline changes, reload deals
  const handlePipelineChange = useCallback(
    async (pipelineId: string) => {
      setSelectedPipelineId(pipelineId);
      setPipelineDropdownOpen(false);
      setLoading(true);
      const dealList = await fetchDeals(pipelineId);
      setDeals(dealList);
      setLoading(false);
    },
    [fetchDeals],
  );

  // --- Computed: deals grouped by stage ---

  const stages: StageData[] = selectedPipeline?.pipeline_stages ?? [];

  const dealsByStage = useMemo(() => {
    const result: Record<string, DealCardData[]> = {};
    for (const stage of stages) {
      result[stage.id] = [];
    }
    for (const deal of deals) {
      const card = dealFromAPI(deal);
      // Apply filters
      if (filterPriority !== "ALL" && deal.priority !== filterPriority) continue;
      if (result[deal.stage_id]) {
        result[deal.stage_id].push(card);
      }
    }
    return result;
  }, [deals, stages, filterPriority]);

  // --- Drag & Drop: move deal to new stage ---

  const handleMoveDeal = useCallback(
    async (dealId: string, stageId: string, lossReason?: string): Promise<boolean> => {
      const res = await fetch(`/api/deals/${dealId}/move`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage_id: stageId, loss_reason: lossReason }),
      });

      if (!res.ok) return false;

      // Update local state with the returned deal
      const updatedDeal = (await res.json()) as DealFromAPI;
      setDeals((prev) =>
        prev.map((d) => (d.id === dealId ? updatedDeal : d)),
      );
      return true;
    },
    [],
  );

  // --- Deal updated via detail panel (edit, move, etc.) ---

  const handleDealUpdated = useCallback((updated: DealFromAPI) => {
    setDeals((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  }, []);

  // --- New Deal ---

  const handleCreateDeal = useCallback(async () => {
    if (!newDealTitle.trim() || !newDealContactId || !selectedPipeline) return;

    const firstStage = stages[0];
    if (!firstStage) return;

    setNewDealSubmitting(true);

    const res = await fetch("/api/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newDealTitle.trim(),
        value: parseFloat(newDealValue) || 0,
        priority: newDealPriority,
        contact_id: newDealContactId,
        company_id: newDealCompanyId || null,
        assigned_to_id: newDealAssigneeId || null,
        pipeline_id: selectedPipeline.id,
        stage_id: firstStage.id,
      }),
    });

    setNewDealSubmitting(false);

    if (res.ok) {
      const created = (await res.json()) as DealFromAPI;
      setDeals((prev) => [created, ...prev]);
      setNewDealOpen(false);
      setNewDealTitle("");
      setNewDealValue("");
      setNewDealContactId("");
      setNewDealCompanyId("");
      setNewDealAssigneeId("");
      setNewDealPriority("MEDIUM");
    }
  }, [
    newDealTitle,
    newDealValue,
    newDealContactId,
    newDealCompanyId,
    newDealAssigneeId,
    newDealPriority,
    selectedPipeline,
    stages,
  ]);

  // Auto-fill company when contact is selected
  useEffect(() => {
    if (newDealContactId) {
      const contact = contacts.find((c) => c.id === newDealContactId);
      if (contact?.company_id) {
        setNewDealCompanyId(contact.company_id);
      }
    }
  }, [newDealContactId, contacts]);

  if (loading) {
    return (
      <PageContainer title="Pipeline" description="Gerencie seus deals em tempo real">
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-orange-500" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Pipeline" description="Gerencie seus deals em tempo real">
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Pipeline selector */}
        <div className="relative">
          <button
            onClick={() => setPipelineDropdownOpen((p) => !p)}
            className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] hover:border-[var(--border-focus)] transition-colors"
          >
            <span className="font-medium">
              {selectedPipeline?.name ?? "Selecionar Pipeline"}
            </span>
            <ChevronDown size={16} className="text-[var(--text-muted)]" />
          </button>

          {pipelineDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setPipelineDropdownOpen(false)}
              />
              <div className="absolute left-0 top-full z-30 mt-1 min-w-[200px] rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] py-1 shadow-lg">
                {pipelines.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handlePipelineChange(p.id)}
                    className={cn(
                      "block w-full px-3 py-2 text-left text-sm transition-colors",
                      p.id === selectedPipelineId
                        ? "bg-orange-500/10 text-orange-500"
                        : "text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]",
                    )}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </>
          )}
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

        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={16} />}
          onClick={() => setNewDealOpen(true)}
        >
          Novo Deal
        </Button>
      </div>

      {/* Filters bar */}
      {filtersOpen && (
        <div className="mb-4 flex flex-wrap gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-3">
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
      <PipelineBoard
        stages={stages}
        initialDeals={dealsByStage}
        contacts={contacts}
        companies={companies}
        onMoveDeal={handleMoveDeal}
        onDealUpdated={handleDealUpdated}
      />

      {/* New Deal Modal */}
      <Modal
        open={newDealOpen}
        onClose={() => setNewDealOpen(false)}
        title="Novo Deal"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Título"
            value={newDealTitle}
            onChange={(e) => setNewDealTitle(e.target.value)}
          />

          <Input
            label="Valor (R$)"
            type="number"
            value={newDealValue}
            onChange={(e) => setNewDealValue(e.target.value)}
          />

          {/* Contact select */}
          <div>
            <label className="mb-1 block text-xs text-[var(--text-muted)]">
              Contato *
            </label>
            <select
              value={newDealContactId}
              onChange={(e) => setNewDealContactId(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none"
            >
              <option value="">Selecionar contato...</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Company select */}
          <div>
            <label className="mb-1 block text-xs text-[var(--text-muted)]">
              Empresa
            </label>
            <select
              value={newDealCompanyId}
              onChange={(e) => setNewDealCompanyId(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none"
            >
              <option value="">Nenhuma</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Assignee select */}
          <div>
            <label className="mb-1 block text-xs text-[var(--text-muted)]">
              Responsável
            </label>
            <select
              value={newDealAssigneeId}
              onChange={(e) => setNewDealAssigneeId(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none"
            >
              <option value="">Nenhum</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="mb-1 block text-xs text-[var(--text-muted)]">
              Prioridade
            </label>
            <div className="flex gap-2">
              {(["HIGH", "MEDIUM", "LOW"] as Priority[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setNewDealPriority(p)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    newDealPriority === p
                      ? "bg-orange-500 text-white"
                      : "bg-[var(--bg-base)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                  )}
                >
                  {p === "HIGH" ? "Alta" : p === "MEDIUM" ? "Média" : "Baixa"}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setNewDealOpen(false)}
              className="rounded-lg px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateDeal}
              disabled={!newDealTitle.trim() || !newDealContactId || newDealSubmitting}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {newDealSubmitting ? "Criando..." : "Criar Deal"}
            </button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
