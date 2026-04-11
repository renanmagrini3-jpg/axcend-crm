"use client";

import { useEffect, useCallback, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Edit3,
  ArrowRightLeft,
  ListPlus,
  StickyNote,
  Loader2,
  Send,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { overlay } from "@/lib/motion";
import { Badge, Avatar, Button, Modal, useToast } from "@/components/ui";
import { NewTaskModal } from "./NewTaskModal";
import type { DealCardData } from "./DealCard";
import type { StageData } from "./PipelineBoard";
import type { Priority } from "@/types";

// --- Types ---

interface ContactOption {
  id: string;
  name: string;
  company_id?: string | null;
}

interface CompanyOption {
  id: string;
  name: string;
}

export interface DealFromApi {
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
}

interface DealNote {
  id: string;
  deal_id: string;
  content: string;
  author_id: string | null;
  author_name: string | null;
  created_at: string;
}

interface DealDetailPanelProps {
  deal: DealCardData | null;
  stageName?: string;
  stages?: StageData[];
  contacts?: ContactOption[];
  companies?: CompanyOption[];
  onClose: () => void;
  onDealUpdated?: (updated: DealFromApi) => void;
  onMoveDeal?: (
    dealId: string,
    stageId: string,
    lossReason?: string,
  ) => Promise<boolean>;
}

const priorityVariant: Record<Priority, "danger" | "warning" | "info"> = {
  HIGH: "danger",
  MEDIUM: "warning",
  LOW: "info",
};

const priorityLabel: Record<Priority, string> = {
  HIGH: "Alta",
  MEDIUM: "Média",
  LOW: "Baixa",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatRelative(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "agora mesmo";
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 30) return `há ${diffD} dia${diffD > 1 ? "s" : ""}`;
  const diffMo = Math.floor(diffD / 30);
  return `há ${diffMo} mês${diffMo > 1 ? "es" : ""}`;
}

const panelVariants = {
  hidden: { x: "100%", opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 30 },
  },
  exit: {
    x: "100%",
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

const inputClass =
  "w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none transition-colors";

const labelClass = "mb-1 block text-xs font-medium text-[var(--text-secondary)]";

// --- Component ---

function DealDetailPanel({
  deal,
  stageName,
  stages = [],
  contacts = [],
  companies = [],
  onClose,
  onDealUpdated,
  onMoveDeal,
}: DealDetailPanelProps) {
  const { toast } = useToast();

  const [fullDeal, setFullDeal] = useState<DealFromApi | null>(null);
  const [loadingDeal, setLoadingDeal] = useState(false);

  const [tasksCount, setTasksCount] = useState(0);
  const [notes, setNotes] = useState<DealNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: "",
    value: "",
    priority: "MEDIUM" as Priority,
    contact_id: "",
    company_id: "",
  });
  const [editSaving, setEditSaving] = useState(false);

  // Move form state
  const [targetStageId, setTargetStageId] = useState("");
  const [lossReason, setLossReason] = useState("");
  const [moving, setMoving] = useState(false);
  const [lossReasonOptions, setLossReasonOptions] = useState<
    Array<{ id: string; name: string }>
  >([]);

  // Note composer state
  const [noteInput, setNoteInput] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const anyModalOpen = editOpen || moveOpen || taskModalOpen;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !anyModalOpen) onClose();
    },
    [onClose, anyModalOpen],
  );

  useEffect(() => {
    if (deal) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [deal, handleKeyDown]);

  // --- Fetch full deal + tasks + notes on open ---

  const loadFullDeal = useCallback(
    async (dealId: string): Promise<DealFromApi | null> => {
      setLoadingDeal(true);
      try {
        const res = await fetch(`/api/deals/${dealId}`);
        const json = await res.json().catch(() => null);
        if (!res.ok || !json) {
          toast(
            (json && typeof json === "object" && "error" in json
              ? (json.error as string)
              : null) || "Erro ao carregar dados do deal",
            "error",
          );
          return null;
        }
        setFullDeal(json as DealFromApi);
        return json as DealFromApi;
      } catch {
        toast("Erro de conexão ao carregar deal", "error");
        return null;
      } finally {
        setLoadingDeal(false);
      }
    },
    [toast],
  );

  const loadTasksCount = useCallback(async (dealId: string) => {
    try {
      const res = await fetch(`/api/tasks?deal_id=${dealId}&limit=1`);
      if (!res.ok) return;
      const json = await res.json();
      setTasksCount(json.pagination?.total ?? 0);
    } catch {
      /* ignore */
    }
  }, []);

  const loadNotes = useCallback(async (dealId: string) => {
    setLoadingNotes(true);
    try {
      const res = await fetch(`/api/deals/${dealId}/notes`);
      if (!res.ok) return;
      const json = await res.json();
      setNotes((json.data ?? []) as DealNote[]);
    } finally {
      setLoadingNotes(false);
    }
  }, []);

  useEffect(() => {
    if (!deal) {
      setFullDeal(null);
      setNotes([]);
      setTasksCount(0);
      return;
    }
    loadFullDeal(deal.id);
    loadTasksCount(deal.id);
    loadNotes(deal.id);
  }, [deal, loadFullDeal, loadTasksCount, loadNotes]);

  // --- Open edit modal: hydrate form from fullDeal ---

  const hydrateEditForm = useCallback((d: DealFromApi) => {
    setEditForm({
      title: d.title,
      value: String(d.value),
      priority: d.priority,
      contact_id: d.contact_id,
      company_id: d.company_id ?? "",
    });
  }, []);

  const openEdit = useCallback(async () => {
    console.log("openEdit clicado", { deal, fullDeal });
    let data = fullDeal;
    if (!data && deal) {
      data = await loadFullDeal(deal.id);
    }
    if (!data) return;
    hydrateEditForm(data);
    setEditOpen(true);
  }, [fullDeal, deal, loadFullDeal, hydrateEditForm]);

  const handleEditSave = useCallback(async () => {
    if (!fullDeal) return;
    if (!editForm.title.trim()) {
      toast("Título é obrigatório", "warning");
      return;
    }
    if (!editForm.contact_id) {
      toast("Contato é obrigatório", "warning");
      return;
    }

    setEditSaving(true);
    try {
      const res = await fetch(`/api/deals/${fullDeal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title.trim(),
          value: parseFloat(editForm.value) || 0,
          priority: editForm.priority,
          contact_id: editForm.contact_id,
          company_id: editForm.company_id || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast(json.error || "Erro ao salvar deal", "error");
        return;
      }
      setFullDeal(json as DealFromApi);
      onDealUpdated?.(json as DealFromApi);
      toast("Deal atualizado", "success");
      setEditOpen(false);
    } catch {
      toast("Erro de conexão", "error");
    } finally {
      setEditSaving(false);
    }
  }, [fullDeal, editForm, toast, onDealUpdated]);

  // --- Move stage ---

  const openMove = useCallback(async () => {
    console.log("openMove clicado", { deal, fullDeal });
    let data = fullDeal;
    if (!data && deal) {
      data = await loadFullDeal(deal.id);
    }
    if (!data) return;
    setTargetStageId(data.stage_id);
    setLossReason("");
    setMoveOpen(true);
    try {
      const res = await fetch("/api/loss-reasons?active=true");
      if (res.ok) {
        const json = await res.json();
        setLossReasonOptions(
          (json as Array<{ id: string; name: string }>) ?? [],
        );
      }
    } catch {
      /* ignore — fallback will still allow submitting via select empty */
    }
  }, [fullDeal, deal, loadFullDeal]);

  const openNewTask = useCallback(async () => {
    console.log("openNewTask clicado", { deal, fullDeal });
    if (!fullDeal && deal) {
      await loadFullDeal(deal.id);
    }
    setTaskModalOpen(true);
  }, [fullDeal, deal, loadFullDeal]);

  const targetStageName = useMemo(
    () => stages.find((s) => s.id === targetStageId)?.name,
    [stages, targetStageId],
  );

  const requiresLossReason = targetStageName === "Fechado Perdido";

  const handleMoveSave = useCallback(async () => {
    if (!fullDeal || !targetStageId) return;
    if (targetStageId === fullDeal.stage_id) {
      setMoveOpen(false);
      return;
    }
    if (requiresLossReason && !lossReason.trim()) {
      toast("Motivo da perda é obrigatório", "warning");
      return;
    }

    setMoving(true);
    try {
      if (onMoveDeal) {
        const ok = await onMoveDeal(
          fullDeal.id,
          targetStageId,
          requiresLossReason ? lossReason.trim() : undefined,
        );
        if (!ok) {
          toast("Erro ao mover deal", "error");
          return;
        }
        // Refetch to keep the panel in sync with the new stage
        await loadFullDeal(fullDeal.id);
        toast("Deal movido para nova etapa", "success");
      } else {
        const res = await fetch(`/api/deals/${fullDeal.id}/move`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stage_id: targetStageId,
            loss_reason: requiresLossReason ? lossReason.trim() : undefined,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          toast(json.error || "Erro ao mover deal", "error");
          return;
        }
        setFullDeal(json as DealFromApi);
        onDealUpdated?.(json as DealFromApi);
        toast("Deal movido para nova etapa", "success");
      }
      setMoveOpen(false);
    } catch {
      toast("Erro de conexão", "error");
    } finally {
      setMoving(false);
    }
  }, [
    fullDeal,
    targetStageId,
    requiresLossReason,
    lossReason,
    onMoveDeal,
    onDealUpdated,
    loadFullDeal,
    toast,
  ]);

  // --- Task created callback ---

  const handleTaskCreated = useCallback(() => {
    const dealId = fullDeal?.id ?? deal?.id;
    setTaskModalOpen(false);
    if (dealId) loadTasksCount(dealId);
  }, [fullDeal, deal, loadTasksCount]);

  // --- Add note ---

  const handleAddNote = useCallback(async () => {
    console.log("handleAddNote clicado", { deal, fullDeal, noteInput });
    const dealId = fullDeal?.id ?? deal?.id;
    if (!dealId || !noteInput.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/deals/${dealId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: noteInput.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast(json.error || "Erro ao salvar nota", "error");
        return;
      }
      setNotes((prev) => [json as DealNote, ...prev]);
      setNoteInput("");
      toast("Nota adicionada", "success");
    } catch {
      toast("Erro de conexão", "error");
    } finally {
      setSavingNote(false);
    }
  }, [fullDeal, deal, noteInput, toast]);

  // --- Render ---

  const displayValue = fullDeal?.value ?? deal?.value ?? 0;
  const displayTitle = fullDeal?.title ?? deal?.title ?? "";
  const displayPriority = (fullDeal?.priority ?? deal?.priority ?? "MEDIUM") as Priority;
  const displayContactName = fullDeal?.contacts?.name ?? deal?.contactName ?? "—";
  const displayCompanyName = fullDeal?.companies?.name ?? deal?.companyName ?? "—";
  const displayStageName = fullDeal?.pipeline_stages?.name ?? stageName ?? "—";

  return (
    <AnimatePresence>
      {deal && (
        <>
          <motion.div
            variants={overlay}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 bg-[var(--bg-overlay)]"
            onClick={() => {
              if (!anyModalOpen) onClose();
            }}
          />

          <motion.aside
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed right-0 top-0 z-50 flex h-dvh w-full max-w-md flex-col border-l border-[var(--border-default)] bg-[var(--bg-surface)] shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-default)] px-6 py-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] line-clamp-1">
                {displayTitle}
              </h2>
              <button
                onClick={onClose}
                className="rounded-md p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* Value & Priority */}
              <div className="mb-6 flex items-center justify-between">
                <p className="text-3xl font-bold text-[var(--text-primary)]">
                  {formatCurrency(Number(displayValue))}
                </p>
                <Badge variant={priorityVariant[displayPriority]}>
                  {priorityLabel[displayPriority]}
                </Badge>
              </div>

              {/* Info grid */}
              <div className="mb-6 grid grid-cols-2 gap-4">
                <InfoItem label="Contato" value={displayContactName} />
                <InfoItem label="Empresa" value={displayCompanyName} />
                <InfoItem label="Etapa" value={displayStageName} />
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-1">
                    Responsável
                  </p>
                  <div className="flex items-center gap-2">
                    <Avatar name={deal.assigneeName} size="sm" />
                    <span className="text-sm text-[var(--text-primary)]">
                      {deal.assigneeName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tasks counter */}
              <div className="mb-6 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] p-3">
                <p className="text-xs text-[var(--text-muted)]">Tarefas vinculadas</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {tasksCount}
                </p>
              </div>

              {/* Actions */}
              <div className="mb-6 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Edit3 size={14} />}
                  onClick={openEdit}
                  loading={loadingDeal && !editOpen && !moveOpen}
                >
                  Editar
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<ArrowRightLeft size={14} />}
                  onClick={openMove}
                  disabled={stages.length === 0}
                >
                  Mover Etapa
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<ListPlus size={14} />}
                  onClick={openNewTask}
                >
                  Adicionar Tarefa
                </Button>
              </div>

              {/* Loss reason indicator */}
              {fullDeal?.loss_reason && (
                <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-500">
                    Motivo da perda
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-primary)]">
                    {fullDeal.loss_reason}
                  </p>
                </div>
              )}

              {/* Notes */}
              <div className="mb-6">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                  <StickyNote size={14} className="text-orange-500" />
                  Notas
                </h3>

                {/* Note composer */}
                <div className="mb-3 flex flex-col gap-2">
                  <textarea
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="Adicionar uma nota sobre este deal..."
                    rows={3}
                    className="w-full resize-none rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus:border-[var(--border-focus)] focus:outline-none"
                  />
                  <div className="flex justify-end">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Send size={12} />}
                      onClick={handleAddNote}
                      disabled={!noteInput.trim() || savingNote}
                    >
                      {savingNote ? "Salvando…" : "Adicionar"}
                    </Button>
                  </div>
                </div>

                {/* Notes list */}
                {loadingNotes ? (
                  <div className="flex items-center justify-center py-4 text-xs text-[var(--text-muted)]">
                    <Loader2 size={14} className="mr-2 animate-spin" />
                    Carregando notas…
                  </div>
                ) : notes.length === 0 ? (
                  <p className="py-4 text-center text-xs text-[var(--text-muted)]">
                    Nenhuma nota ainda.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] p-3"
                      >
                        <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">
                          {note.content}
                        </p>
                        <p className="mt-2 text-xs text-[var(--text-muted)]">
                          {note.author_name ?? "Membro"} ·{" "}
                          {formatRelative(note.created_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.aside>

          {/* --- Edit Modal --- */}
          <Modal
            open={editOpen}
            onClose={() => setEditOpen(false)}
            title="Editar Deal"
            className="max-w-md"
          >
            <div className="flex flex-col gap-4">
              <div>
                <label className={labelClass}>Título</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, title: e.target.value }))
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Valor (R$)</label>
                <input
                  type="number"
                  value={editForm.value}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, value: e.target.value }))
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Prioridade</label>
                <div className="flex gap-2">
                  {(["HIGH", "MEDIUM", "LOW"] as Priority[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() =>
                        setEditForm((prev) => ({ ...prev, priority: p }))
                      }
                      className={cn(
                        "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                        editForm.priority === p
                          ? "bg-orange-500 text-white"
                          : "bg-[var(--bg-base)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                      )}
                    >
                      {priorityLabel[p]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Contato *</label>
                <select
                  value={editForm.contact_id}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, contact_id: e.target.value }))
                  }
                  className={inputClass}
                >
                  <option value="">Selecionar contato...</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Empresa</label>
                <select
                  value={editForm.company_id}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, company_id: e.target.value }))
                  }
                  className={inputClass}
                >
                  <option value="">Nenhuma</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditOpen(false)}
                  disabled={editSaving}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleEditSave}
                  loading={editSaving}
                >
                  Salvar
                </Button>
              </div>
            </div>
          </Modal>

          {/* --- Move Stage Modal --- */}
          <Modal
            open={moveOpen}
            onClose={() => setMoveOpen(false)}
            title="Mover Etapa"
            className="max-w-md"
          >
            <div className="flex flex-col gap-4">
              <div>
                <label className={labelClass}>Nova etapa</label>
                <select
                  value={targetStageId}
                  onChange={(e) => setTargetStageId(e.target.value)}
                  className={inputClass}
                >
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {requiresLossReason && (
                <div>
                  <label className={labelClass}>Motivo da perda *</label>
                  <select
                    value={lossReason}
                    onChange={(e) => setLossReason(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Selecione um motivo</option>
                    {lossReasonOptions.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                  {lossReasonOptions.length === 0 && (
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      Nenhum motivo cadastrado. Cadastre em Configurações → Motivos de Perda.
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setMoveOpen(false)}
                  disabled={moving}
                >
                  Cancelar
                </Button>
                <Button
                  variant={requiresLossReason ? "danger" : "primary"}
                  size="sm"
                  onClick={handleMoveSave}
                  loading={moving}
                >
                  {requiresLossReason ? "Confirmar Perda" : "Mover"}
                </Button>
              </div>
            </div>
          </Modal>

          {/* --- New Task Modal --- */}
          <NewTaskModal
            open={taskModalOpen}
            onClose={() => setTaskModalOpen(false)}
            onCreated={handleTaskCreated}
            presetDealId={fullDeal?.id}
            presetContactId={fullDeal?.contact_id}
            lockDeal
          />
        </>
      )}
    </AnimatePresence>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[var(--text-muted)] mb-1">{label}</p>
      <p className="text-sm font-medium text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

export { DealDetailPanel };
