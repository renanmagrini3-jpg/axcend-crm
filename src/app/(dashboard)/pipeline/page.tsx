"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Plus,
  ChevronDown,
  Filter,
  Loader2,
  Settings2,
  ArrowUp,
  ArrowDown,
  Trash2,
  Pencil,
  Search,
  X as XIcon,
} from "lucide-react";
import { PageContainer } from "@/components/layout";
import { Button, Modal, Input } from "@/components/ui";
import { PipelineBoard, type StageData, type DealCardData, CustomFieldsForm, saveCustomFieldValues } from "@/components/data";
import type { DealFromApi } from "@/components/data/DealDetailPanel";
import { useOrganization } from "@/lib/organization";
import { cn } from "@/lib/cn";
import type { Priority } from "@/types";

// --- Types ---

type DealFromAPI = DealFromApi;

interface PipelineData {
  id: string;
  name: string;
  pipeline_stages: StageData[];
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

function dealFromAPI(deal: DealFromAPI, extras?: { nextTask?: string | null; notesCount?: number }): DealCardData {
  return {
    id: deal.id,
    title: deal.title,
    value: Number(deal.value),
    priority: deal.priority as Priority,
    contactName: deal.contacts?.name ?? "—",
    contactPhone: deal.contacts?.phone ?? undefined,
    companyName: deal.companies?.name,
    assigneeName: deal.organization_members?.name ?? "—",
    lossReason: deal.loss_reason,
    stageName: deal.pipeline_stages?.name,
    createdAt: new Date(deal.created_at),
    nextTask: extras?.nextTask,
    notesCount: extras?.notesCount,
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
  // Extra card data: next task per deal
  const [dealExtras, setDealExtras] = useState<Record<string, { nextTask?: string | null }>>({});

  // Filters
  const [filterPriority, setFilterPriority] = useState<Priority | "ALL">("ALL");
  const [filterSearch, setFilterSearch] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterValueMin, setFilterValueMin] = useState("");
  const [filterValueMax, setFilterValueMax] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const hasActiveFilters = filterPriority !== "ALL" || filterSearch || filterAssignee || filterDateFrom || filterDateTo || filterValueMin || filterValueMax;

  function clearFilters() {
    setFilterPriority("ALL");
    setFilterSearch("");
    setFilterAssignee("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterValueMin("");
    setFilterValueMax("");
  }

  // Stage editor modal
  const [stageEditorOpen, setStageEditorOpen] = useState(false);
  const [editorStages, setEditorStages] = useState<StageData[]>([]);
  const [newStageName, setNewStageName] = useState("");
  const [stageEditorSaving, setStageEditorSaving] = useState(false);
  const [renamingStageId, setRenamingStageId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // New pipeline modal
  const [newPipelineOpen, setNewPipelineOpen] = useState(false);
  const [newPipelineName, setNewPipelineName] = useState("");
  const [newPipelineSubmitting, setNewPipelineSubmitting] = useState(false);

  // New deal modal
  const [newDealOpen, setNewDealOpen] = useState(false);
  const [newDealTitle, setNewDealTitle] = useState("");
  const [newDealValue, setNewDealValue] = useState("");
  const [newDealContactId, setNewDealContactId] = useState("");
  const [newDealCompanyId, setNewDealCompanyId] = useState("");
  const [newDealPriority, setNewDealPriority] = useState<Priority>("MEDIUM");
  const [newDealAssigneeId, setNewDealAssigneeId] = useState("");
  const [newDealSubmitting, setNewDealSubmitting] = useState(false);
  const [newDealCustomFields, setNewDealCustomFields] = useState<Record<string, string>>({});

  const { isB2C } = useOrganization();
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

  const loadDealExtras = useCallback(async (dealList: DealFromAPI[]) => {
    if (dealList.length === 0) return;
    // Load next pending task for each deal in a batch
    const extras: Record<string, { nextTask?: string | null }> = {};
    await Promise.all(
      dealList.map(async (deal) => {
        try {
          const res = await fetch(`/api/tasks?deal_id=${deal.id}&status=PENDING&limit=1&sortBy=due_at&order=asc`);
          if (!res.ok) return;
          const json = await res.json();
          const firstTask = json.data?.[0];
          extras[deal.id] = {
            nextTask: firstTask
              ? `${firstTask.title} · ${new Date(firstTask.due_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`
              : null,
          };
        } catch { /* ignore */ }
      }),
    );
    setDealExtras(extras);
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
        loadDealExtras(dealList);
      }

      setLoading(false);
    }
    init();
  }, [fetchPipelines, fetchDeals, createDefaultPipeline, loadDealExtras]);

  // When pipeline changes, reload deals
  const handlePipelineChange = useCallback(
    async (pipelineId: string) => {
      setSelectedPipelineId(pipelineId);
      setPipelineDropdownOpen(false);
      setLoading(true);
      const dealList = await fetchDeals(pipelineId);
      setDeals(dealList);
      loadDealExtras(dealList);
      setLoading(false);
    },
    [fetchDeals, loadDealExtras],
  );

  // --- Computed: deals grouped by stage ---

  const stages: StageData[] = selectedPipeline?.pipeline_stages ?? [];

  const dealsByStage = useMemo(() => {
    const result: Record<string, DealCardData[]> = {};
    for (const stage of stages) {
      result[stage.id] = [];
    }
    const searchLower = filterSearch.toLowerCase();
    const valMin = filterValueMin ? parseFloat(filterValueMin) : null;
    const valMax = filterValueMax ? parseFloat(filterValueMax) : null;

    for (const deal of deals) {
      // Apply filters on raw deal data
      if (filterPriority !== "ALL" && deal.priority !== filterPriority) continue;
      if (filterAssignee && deal.assigned_to_id !== filterAssignee) continue;
      if (valMin !== null && Number(deal.value) < valMin) continue;
      if (valMax !== null && Number(deal.value) > valMax) continue;
      if (filterDateFrom && deal.created_at < filterDateFrom) continue;
      if (filterDateTo && deal.created_at > filterDateTo + "T23:59:59") continue;
      if (searchLower) {
        const matchTitle = deal.title.toLowerCase().includes(searchLower);
        const matchContact = (deal.contacts?.name ?? "").toLowerCase().includes(searchLower);
        const matchPhone = (deal.contacts?.phone ?? "").includes(searchLower);
        if (!matchTitle && !matchContact && !matchPhone) continue;
      }

      const card = dealFromAPI(deal, dealExtras[deal.id]);
      if (result[deal.stage_id]) {
        result[deal.stage_id].push(card);
      }
    }
    return result;
  }, [deals, stages, dealExtras, filterPriority, filterSearch, filterAssignee, filterDateFrom, filterDateTo, filterValueMin, filterValueMax]);

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
      // Save custom field values
      if (Object.keys(newDealCustomFields).length > 0) {
        await saveCustomFieldValues(created.id, "deal", newDealCustomFields);
      }
      setDeals((prev) => [created, ...prev]);
      setNewDealOpen(false);
      setNewDealTitle("");
      setNewDealValue("");
      setNewDealContactId("");
      setNewDealCompanyId("");
      setNewDealAssigneeId("");
      setNewDealPriority("MEDIUM");
      setNewDealCustomFields({});
    }
  }, [
    newDealTitle,
    newDealValue,
    newDealContactId,
    newDealCompanyId,
    newDealAssigneeId,
    newDealPriority,
    newDealCustomFields,
    selectedPipeline,
    stages,
  ]);

  // --- Stage editor ---
  const openStageEditor = useCallback(() => {
    if (!selectedPipeline) return;
    setEditorStages([...selectedPipeline.pipeline_stages].sort((a, b) => a.order - b.order));
    setNewStageName("");
    setRenamingStageId(null);
    setStageEditorOpen(true);
  }, [selectedPipeline]);

  const editorAddStage = useCallback(async () => {
    if (!newStageName.trim() || !selectedPipelineId) return;
    setStageEditorSaving(true);
    const res = await fetch(`/api/pipelines/${selectedPipelineId}/stages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newStageName.trim() }),
    });
    if (res.ok) {
      const refreshed = await fetchPipelines();
      setPipelines(refreshed);
      const updated = refreshed.find((p) => p.id === selectedPipelineId);
      if (updated) setEditorStages([...updated.pipeline_stages].sort((a, b) => a.order - b.order));
      setNewStageName("");
    }
    setStageEditorSaving(false);
  }, [newStageName, selectedPipelineId, fetchPipelines]);

  const editorDeleteStage = useCallback(async (stageId: string, name: string) => {
    if (!window.confirm(`Excluir a etapa "${name}"?`)) return;
    await fetch(`/api/pipelines/${selectedPipelineId}/stages/${stageId}`, { method: "DELETE" });
    const refreshed = await fetchPipelines();
    setPipelines(refreshed);
    const updated = refreshed.find((p) => p.id === selectedPipelineId);
    if (updated) setEditorStages([...updated.pipeline_stages].sort((a, b) => a.order - b.order));
  }, [selectedPipelineId, fetchPipelines]);

  const editorRenameStage = useCallback(async (stageId: string) => {
    if (!renameValue.trim()) return;
    await fetch(`/api/pipelines/${selectedPipelineId}/stages/${stageId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: renameValue.trim() }),
    });
    const refreshed = await fetchPipelines();
    setPipelines(refreshed);
    const updated = refreshed.find((p) => p.id === selectedPipelineId);
    if (updated) setEditorStages([...updated.pipeline_stages].sort((a, b) => a.order - b.order));
    setRenamingStageId(null);
  }, [renameValue, selectedPipelineId, fetchPipelines]);

  const editorReorder = useCallback(async (stageId: string, direction: "up" | "down") => {
    const sorted = [...editorStages];
    const idx = sorted.findIndex((s) => s.id === stageId);
    const swapWith = direction === "up" ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= sorted.length) return;
    [sorted[idx], sorted[swapWith]] = [sorted[swapWith], sorted[idx]];
    setEditorStages(sorted);
    const payload = sorted.map((s, i) => ({ id: s.id, order: i + 1 }));
    await fetch(`/api/pipelines/${selectedPipelineId}/stages/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stages: payload }),
    });
    const refreshed = await fetchPipelines();
    setPipelines(refreshed);
  }, [editorStages, selectedPipelineId, fetchPipelines]);

  // --- Create new pipeline ---
  const handleCreatePipeline = useCallback(async () => {
    if (!newPipelineName.trim()) return;
    setNewPipelineSubmitting(true);
    try {
      const res = await fetch("/api/pipelines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newPipelineName.trim() }),
      });
      if (res.ok) {
        const created = (await res.json()) as PipelineData;
        setPipelines((prev) => [...prev, created]);
        setSelectedPipelineId(created.id);
        setDeals([]);
        setNewPipelineOpen(false);
        setNewPipelineName("");
      }
    } catch { /* ignore */ }
    setNewPipelineSubmitting(false);
  }, [newPipelineName]);

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
                <hr className="my-1 border-[var(--border-default)]" />
                <button
                  onClick={() => {
                    setPipelineDropdownOpen(false);
                    setNewPipelineOpen(true);
                    setNewPipelineName("");
                  }}
                  className="block w-full px-3 py-2 text-left text-sm font-medium text-orange-500 hover:bg-[var(--bg-elevated)] transition-colors"
                >
                  + Novo Pipeline
                </button>
              </div>
            </>
          )}
        </div>

        {selectedPipeline && (
          <button
            onClick={openStageEditor}
            className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
            title="Editar etapas"
          >
            <Settings2 size={16} />
          </button>
        )}

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
        <div className="mb-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-3">
          <div className="flex flex-wrap gap-3">
            {/* Search */}
            <div className="min-w-[180px] flex-1">
              <label className="mb-1 block text-xs text-[var(--text-muted)]">Busca</label>
              <div className="relative">
                <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Deal, contato ou telefone..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  className="w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-base)] pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-focus)] focus:outline-none"
                />
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="mb-1 block text-xs text-[var(--text-muted)]">Prioridade</label>
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

            {/* Assignee */}
            <div>
              <label className="mb-1 block text-xs text-[var(--text-muted)]">Responsável</label>
              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                className="rounded-md border border-[var(--border-default)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none"
              >
                <option value="">Todos</option>
                {members.map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
              </select>
            </div>

            {/* Date from/to */}
            <div>
              <label className="mb-1 block text-xs text-[var(--text-muted)]">Criado de</label>
              <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="rounded-md border border-[var(--border-default)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--text-muted)]">Criado até</label>
              <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="rounded-md border border-[var(--border-default)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none" />
            </div>

            {/* Value range */}
            <div>
              <label className="mb-1 block text-xs text-[var(--text-muted)]">Valor mínimo</label>
              <input type="number" placeholder="R$ 0" value={filterValueMin} onChange={(e) => setFilterValueMin(e.target.value)} className="w-24 rounded-md border border-[var(--border-default)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[var(--text-muted)]">Valor máximo</label>
              <input type="number" placeholder="R$ ∞" value={filterValueMax} onChange={(e) => setFilterValueMax(e.target.value)} className="w-24 rounded-md border border-[var(--border-default)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none" />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <XIcon size={12} />
                Limpar filtros
              </button>
            </div>
          )}
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

          {/* Company select — hidden in B2C */}
          {!isB2C && (
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
          )}

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

          {/* Custom fields */}
          <CustomFieldsForm
            entityType="deal"
            values={newDealCustomFields}
            onChange={setNewDealCustomFields}
          />

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
      {/* Stage Editor Modal */}
      <Modal
        open={stageEditorOpen}
        onClose={() => setStageEditorOpen(false)}
        title={`Etapas — ${selectedPipeline?.name ?? ""}`}
        className="max-w-md"
      >
        <div className="flex flex-col gap-4">
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {editorStages.map((stage, idx) => (
              <div key={stage.id} className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2">
                <div className="flex shrink-0 flex-col">
                  <button disabled={idx === 0} onClick={() => editorReorder(stage.id, "up")} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30"><ArrowUp size={12} /></button>
                  <button disabled={idx === editorStages.length - 1} onClick={() => editorReorder(stage.id, "down")} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30"><ArrowDown size={12} /></button>
                </div>
                {renamingStageId === stage.id ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") editorRenameStage(stage.id); if (e.key === "Escape") setRenamingStageId(null); }}
                    onBlur={() => editorRenameStage(stage.id)}
                    className="flex-1 rounded border border-[var(--border-focus)] bg-[var(--bg-surface)] px-2 py-1 text-sm text-[var(--text-primary)] outline-none"
                  />
                ) : (
                  <span className="flex-1 text-sm text-[var(--text-primary)]">{stage.name}</span>
                )}
                <span className="text-xs text-[var(--text-muted)]">{idx + 1}ª</span>
                <button onClick={() => { setRenamingStageId(stage.id); setRenameValue(stage.name); }} className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"><Pencil size={12} /></button>
                <button onClick={() => editorDeleteStage(stage.id, stage.name)} className="rounded p-1 text-[var(--text-muted)] hover:text-red-400"><Trash2 size={12} /></button>
              </div>
            ))}
            {editorStages.length === 0 && (
              <p className="py-4 text-center text-xs text-[var(--text-muted)]">Nenhuma etapa.</p>
            )}
          </div>
          <div className="flex gap-2">
            <input
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") editorAddStage(); }}
              placeholder="Nova etapa..."
              className="flex-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none"
            />
            <button
              onClick={editorAddStage}
              disabled={!newStageName.trim() || stageEditorSaving}
              className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => {
                setStageEditorOpen(false);
                // Reload deals to reflect any stage changes
                if (selectedPipelineId) fetchDeals(selectedPipelineId).then(setDeals);
              }}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
            >
              Concluído
            </button>
          </div>
        </div>
      </Modal>

      {/* New Pipeline Modal */}
      <Modal
        open={newPipelineOpen}
        onClose={() => setNewPipelineOpen(false)}
        title="Novo Pipeline"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Nome do Pipeline"
            value={newPipelineName}
            onChange={(e) => setNewPipelineName(e.target.value)}
            placeholder="Ex: Pipeline Enterprise"
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setNewPipelineOpen(false)}
              className="rounded-lg px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreatePipeline}
              disabled={!newPipelineName.trim() || newPipelineSubmitting}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {newPipelineSubmitting ? "Criando..." : "Criar Pipeline"}
            </button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
