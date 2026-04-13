"use client";

import { useEffect, useCallback, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Edit3,
  ArrowRightLeft,
  ListPlus,
  StickyNote,
  Loader2,
  Send,
  Trash2,
  Paperclip,
  Upload,
  Download,
  CheckSquare,
  Pencil,
  Check,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { overlay } from "@/lib/motion";
import { Badge, Avatar, Button, Modal, useToast } from "@/components/ui";
import { useOrganization } from "@/lib/organization";
import { CustomFieldsForm, saveCustomFieldValues } from "./CustomFieldsForm";
import type { CustomFieldDef } from "./CustomFieldsForm";
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
  organization_members: { id: string; name: string } | null;
}

interface DealNote {
  id: string;
  deal_id: string;
  content: string;
  author_id: string | null;
  author_name: string | null;
  created_at: string;
}

interface LinkedTask {
  id: string;
  title: string;
  status: string;
  due_at: string;
  type: string;
  priority: string;
}

interface DealAttachment {
  id: string;
  deal_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  uploaded_by: string;
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
  onDealDeleted?: (dealId: string) => void;
}

type PanelTab = "details" | "tasks" | "notes" | "attachments";

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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
  onDealDeleted,
}: DealDetailPanelProps) {
  const { toast } = useToast();
  const { isB2C } = useOrganization();

  const [activeTab, setActiveTab] = useState<PanelTab>("details");
  const [fullDeal, setFullDeal] = useState<DealFromApi | null>(null);
  const [loadingDeal, setLoadingDeal] = useState(false);

  // Tasks
  const [linkedTasks, setLinkedTasks] = useState<LinkedTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editTaskDueAt, setEditTaskDueAt] = useState("");

  // Notes
  const [notes, setNotes] = useState<DealNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);

  // Attachments
  const [attachments, setAttachments] = useState<DealAttachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom fields display
  const [customFieldDefs, setCustomFieldDefs] = useState<CustomFieldDef[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

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
    assigned_to_id: "",
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editCustomFields, setEditCustomFields] = useState<Record<string, string>>({});
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name: string }>>([]);

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

  // --- Data loaders ---

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

  const loadTasks = useCallback(async (dealId: string) => {
    setLoadingTasks(true);
    try {
      const res = await fetch(`/api/tasks?deal_id=${dealId}&limit=50`);
      if (!res.ok) return;
      const json = await res.json();
      setLinkedTasks(
        (json.data ?? []).map((t: LinkedTask) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          due_at: t.due_at,
          type: t.type,
          priority: t.priority,
        })),
      );
    } catch {
      /* ignore */
    } finally {
      setLoadingTasks(false);
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

  const loadAttachments = useCallback(async (dealId: string) => {
    setLoadingAttachments(true);
    try {
      const res = await fetch(`/api/deals/${dealId}/attachments`);
      if (!res.ok) return;
      const json = await res.json();
      setAttachments(json as DealAttachment[]);
    } catch {
      /* ignore */
    } finally {
      setLoadingAttachments(false);
    }
  }, []);

  const loadCustomFields = useCallback(async (dealId: string) => {
    try {
      const [defsRes, valsRes] = await Promise.all([
        fetch("/api/custom-fields?entity_type=deal"),
        fetch(`/api/custom-field-values?entity_id=${dealId}&entity_type=deal`),
      ]);
      if (defsRes.ok) {
        const defs = (await defsRes.json()) as CustomFieldDef[];
        setCustomFieldDefs(defs.filter((d) => d.is_active));
      }
      if (valsRes.ok) {
        const vals = (await valsRes.json()) as Array<{ custom_field_id: string; value: string }>;
        const map: Record<string, string> = {};
        for (const v of vals) map[v.custom_field_id] = v.value;
        setCustomFieldValues(map);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!deal) {
      setFullDeal(null);
      setNotes([]);
      setLinkedTasks([]);
      setAttachments([]);
      setCustomFieldDefs([]);
      setCustomFieldValues({});
      setActiveTab("details");
      return;
    }
    loadFullDeal(deal.id);
    loadTasks(deal.id);
    loadNotes(deal.id);
    loadAttachments(deal.id);
    loadCustomFields(deal.id);
  }, [deal, loadFullDeal, loadTasks, loadNotes, loadAttachments, loadCustomFields]);

  // --- Edit modal ---

  const hydrateEditForm = useCallback((d: DealFromApi) => {
    setEditForm({
      title: d.title,
      value: String(d.value),
      priority: d.priority,
      contact_id: d.contact_id,
      company_id: d.company_id ?? "",
      assigned_to_id: d.assigned_to_id ?? "",
    });
  }, []);

  const openEdit = useCallback(async () => {
    let data = fullDeal;
    if (!data && deal) {
      data = await loadFullDeal(deal.id);
    }
    if (!data) return;
    hydrateEditForm(data);
    setEditOpen(true);
    try {
      const res = await fetch("/api/team");
      if (res.ok) {
        const json = await res.json();
        setTeamMembers((json as Array<{ id: string; name: string }>) ?? []);
      }
    } catch { /* ignore */ }
  }, [fullDeal, deal, loadFullDeal, hydrateEditForm]);

  const handleEditSave = useCallback(async () => {
    if (!fullDeal) return;
    if (!editForm.title.trim()) { toast("Título é obrigatório", "warning"); return; }
    if (!editForm.contact_id) { toast("Contato é obrigatório", "warning"); return; }

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
          assigned_to_id: editForm.assigned_to_id || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) { toast(json.error || "Erro ao salvar deal", "error"); return; }
      if (Object.keys(editCustomFields).length > 0) {
        await saveCustomFieldValues(fullDeal.id, "deal", editCustomFields);
        setCustomFieldValues({ ...editCustomFields });
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
  }, [fullDeal, editForm, editCustomFields, toast, onDealUpdated]);

  // --- Move stage ---

  const openMove = useCallback(async () => {
    let data = fullDeal;
    if (!data && deal) { data = await loadFullDeal(deal.id); }
    if (!data) return;
    setTargetStageId(data.stage_id);
    setLossReason("");
    setMoveOpen(true);
    try {
      const res = await fetch("/api/loss-reasons?active=true");
      if (res.ok) { setLossReasonOptions((await res.json()) ?? []); }
    } catch { /* ignore */ }
  }, [fullDeal, deal, loadFullDeal]);

  const openNewTask = useCallback(async () => {
    if (!fullDeal && deal) { await loadFullDeal(deal.id); }
    setTaskModalOpen(true);
  }, [fullDeal, deal, loadFullDeal]);

  const targetStageName = useMemo(
    () => stages.find((s) => s.id === targetStageId)?.name,
    [stages, targetStageId],
  );
  const requiresLossReason = targetStageName === "Fechado Perdido";

  const handleMoveSave = useCallback(async () => {
    if (!fullDeal || !targetStageId) return;
    if (targetStageId === fullDeal.stage_id) { setMoveOpen(false); return; }
    if (requiresLossReason && !lossReason.trim()) { toast("Motivo da perda é obrigatório", "warning"); return; }

    setMoving(true);
    try {
      if (onMoveDeal) {
        const ok = await onMoveDeal(fullDeal.id, targetStageId, requiresLossReason ? lossReason.trim() : undefined);
        if (!ok) { toast("Erro ao mover deal", "error"); return; }
        await loadFullDeal(fullDeal.id);
        toast("Deal movido para nova etapa", "success");
      } else {
        const res = await fetch(`/api/deals/${fullDeal.id}/move`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stage_id: targetStageId, loss_reason: requiresLossReason ? lossReason.trim() : undefined }),
        });
        const json = await res.json();
        if (!res.ok) { toast(json.error || "Erro ao mover deal", "error"); return; }
        setFullDeal(json as DealFromApi);
        onDealUpdated?.(json as DealFromApi);
        toast("Deal movido para nova etapa", "success");
      }
      setMoveOpen(false);
    } catch { toast("Erro de conexão", "error"); } finally { setMoving(false); }
  }, [fullDeal, targetStageId, requiresLossReason, lossReason, onMoveDeal, onDealUpdated, loadFullDeal, toast]);

  // --- Task actions ---

  const handleToggleTask = useCallback(async (taskId: string) => {
    const task = linkedTasks.find((t) => t.id === taskId);
    if (!task) return;
    const newStatus = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
    setLinkedTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        setLinkedTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: task.status } : t));
        toast("Erro ao atualizar tarefa", "error");
      }
    } catch {
      setLinkedTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: task.status } : t));
    }
  }, [linkedTasks, toast]);

  const handleEditTask = useCallback((task: LinkedTask) => {
    setEditingTaskId(task.id);
    setEditTaskTitle(task.title);
    setEditTaskDueAt(task.due_at.slice(0, 16));
  }, []);

  const handleSaveTaskEdit = useCallback(async () => {
    if (!editingTaskId || !editTaskTitle.trim()) return;
    try {
      const res = await fetch(`/api/tasks/${editingTaskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTaskTitle.trim(), due_at: editTaskDueAt }),
      });
      if (res.ok) {
        setLinkedTasks((prev) =>
          prev.map((t) =>
            t.id === editingTaskId ? { ...t, title: editTaskTitle.trim(), due_at: editTaskDueAt } : t,
          ),
        );
        toast("Tarefa atualizada", "success");
      }
    } catch { toast("Erro de conexão", "error"); }
    setEditingTaskId(null);
  }, [editingTaskId, editTaskTitle, editTaskDueAt, toast]);

  const handleTaskCreated = useCallback(() => {
    const dealId = fullDeal?.id ?? deal?.id;
    setTaskModalOpen(false);
    if (dealId) loadTasks(dealId);
  }, [fullDeal, deal, loadTasks]);

  // --- Notes ---

  const handleAddNote = useCallback(async () => {
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
      if (!res.ok) { toast(json.error || "Erro ao salvar nota", "error"); return; }
      setNotes((prev) => [json as DealNote, ...prev]);
      setNoteInput("");
      toast("Nota adicionada", "success");
    } catch { toast("Erro de conexão", "error"); } finally { setSavingNote(false); }
  }, [fullDeal, deal, noteInput, toast]);

  // --- Attachments ---

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dealId = fullDeal?.id ?? deal?.id;
    if (!dealId) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/deals/${dealId}/attachments`, {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) { toast(json.error || "Erro ao enviar arquivo", "error"); return; }
      setAttachments((prev) => [json as DealAttachment, ...prev]);
      toast("Arquivo enviado", "success");
    } catch { toast("Erro de conexão", "error"); } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [fullDeal, deal, toast]);

  const handleDownload = useCallback(async (att: DealAttachment) => {
    try {
      const dealId = fullDeal?.id ?? deal?.id;
      if (!dealId) return;
      // Get a signed URL from Supabase Storage via the client
      const res = await fetch(`/api/deals/${dealId}/attachments`);
      if (!res.ok) return;
      // For download, we create a temporary signed URL
      // Use a simple approach: fetch the file through a proxy or direct signed URL
      const link = document.createElement("a");
      link.href = `/api/deals/${dealId}/attachments?download=${att.file_path}`;
      link.download = att.file_name;
      // Fallback: open in new tab to trigger download
      window.open(`/api/deals/${dealId}/attachments?download=${encodeURIComponent(att.file_path)}`, "_blank");
    } catch { toast("Erro ao baixar arquivo", "error"); }
  }, [fullDeal, deal, toast]);

  const handleDeleteAttachment = useCallback(async (att: DealAttachment) => {
    if (!window.confirm(`Excluir "${att.file_name}"?`)) return;
    const dealId = fullDeal?.id ?? deal?.id;
    if (!dealId) return;
    try {
      const res = await fetch(`/api/deals/${dealId}/attachments?attachment_id=${att.id}`, { method: "DELETE" });
      if (res.ok || res.status === 204) {
        setAttachments((prev) => prev.filter((a) => a.id !== att.id));
        toast("Anexo removido", "success");
      } else {
        toast("Erro ao remover anexo", "error");
      }
    } catch { toast("Erro de conexão", "error"); }
  }, [fullDeal, deal, toast]);

  // --- Delete deal ---

  const handleDelete = useCallback(async () => {
    const dealId = fullDeal?.id ?? deal?.id;
    if (!dealId) return;
    if (!window.confirm("Tem certeza que deseja excluir este deal? Esta ação não pode ser desfeita.")) return;
    try {
      const res = await fetch(`/api/deals/${dealId}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        toast(json.error || "Erro ao excluir deal", "error");
        return;
      }
      toast("Deal excluído", "success");
      onDealDeleted?.(dealId);
      onClose();
    } catch { toast("Erro de conexão", "error"); }
  }, [fullDeal, deal, toast, onDealDeleted, onClose]);

  // --- Derived display values ---

  const displayValue = fullDeal?.value ?? deal?.value ?? 0;
  const displayTitle = fullDeal?.title ?? deal?.title ?? "";
  const displayPriority = (fullDeal?.priority ?? deal?.priority ?? "MEDIUM") as Priority;
  const displayContactName = fullDeal?.contacts?.name ?? deal?.contactName ?? "—";
  const displayCompanyName = fullDeal?.companies?.name ?? deal?.companyName ?? "—";
  const displayStageName = fullDeal?.pipeline_stages?.name ?? stageName ?? "—";
  const displayAssigneeName = fullDeal?.organization_members?.name ?? deal?.assigneeName ?? "—";

  const pendingTasks = linkedTasks.filter((t) => t.status !== "COMPLETED");
  const completedTasks = linkedTasks.filter((t) => t.status === "COMPLETED");

  const tabItems: { key: PanelTab; label: string; count?: number }[] = [
    { key: "details", label: "Detalhes" },
    { key: "tasks", label: "Tarefas", count: linkedTasks.length },
    { key: "notes", label: "Notas", count: notes.length },
    { key: "attachments", label: "Anexos", count: attachments.length },
  ];

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
            onClick={() => { if (!anyModalOpen) onClose(); }}
          />

          <motion.aside
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed right-0 top-0 z-50 flex h-dvh w-full max-w-lg flex-col border-l border-[var(--border-default)] bg-[var(--bg-surface)] shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-default)] px-6 py-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] line-clamp-1">
                  {displayTitle}
                </h2>
                <p className="text-sm text-[var(--text-muted)]">
                  {formatCurrency(Number(displayValue))}
                </p>
              </div>
              <button
                onClick={onClose}
                className="ml-3 rounded-md p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[var(--border-default)] px-6">
              {tabItems.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "relative flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors",
                    activeTab === tab.key
                      ? "text-orange-500"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                  )}
                >
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="rounded-full bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[10px] font-medium">
                      {tab.count}
                    </span>
                  )}
                  {activeTab === tab.key && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">

              {/* ===== DETAILS TAB ===== */}
              {activeTab === "details" && (
                <>
                  <div className="mb-6 flex items-center justify-between">
                    <Badge variant={priorityVariant[displayPriority]}>
                      {priorityLabel[displayPriority]}
                    </Badge>
                  </div>

                  <div className="mb-6 grid grid-cols-2 gap-4">
                    <InfoItem label="Contato" value={displayContactName} />
                    {!isB2C && <InfoItem label="Empresa" value={displayCompanyName} />}
                    <InfoItem label="Etapa" value={displayStageName} />
                    <div>
                      <p className="text-xs text-[var(--text-muted)] mb-1">Responsável</p>
                      <div className="flex items-center gap-2">
                        <Avatar name={displayAssigneeName} size="sm" />
                        <span className="text-sm text-[var(--text-primary)]">{displayAssigneeName}</span>
                      </div>
                    </div>
                    {fullDeal?.contacts?.phone && (
                      <InfoItem label="Telefone" value={fullDeal.contacts.phone} />
                    )}
                  </div>

                  {customFieldDefs.length > 0 && (
                    <div className="mb-6">
                      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                        Campos Personalizados
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {customFieldDefs.map((field) => {
                          const val = customFieldValues[field.id];
                          let displayVal = val || "—";
                          if (field.field_type === "boolean") displayVal = val === "true" ? "Sim" : val === "false" ? "Não" : "—";
                          else if (field.field_type === "date" && val) displayVal = new Date(val).toLocaleDateString("pt-BR");
                          return <InfoItem key={field.id} label={field.field_name} value={displayVal} />;
                        })}
                      </div>
                    </div>
                  )}

                  {fullDeal?.loss_reason && (
                    <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-red-500">Motivo da perda</p>
                      <p className="mt-1 text-sm text-[var(--text-primary)]">{fullDeal.loss_reason}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm" icon={<Edit3 size={14} />} onClick={openEdit} loading={loadingDeal && !editOpen && !moveOpen}>Editar</Button>
                    <Button variant="secondary" size="sm" icon={<ArrowRightLeft size={14} />} onClick={openMove} disabled={stages.length === 0}>Mover Etapa</Button>
                    <Button variant="secondary" size="sm" icon={<ListPlus size={14} />} onClick={openNewTask}>Adicionar Tarefa</Button>
                    <Button variant="danger" size="sm" icon={<Trash2 size={14} />} onClick={handleDelete}>Excluir</Button>
                  </div>
                </>
              )}

              {/* ===== TASKS TAB ===== */}
              {activeTab === "tasks" && (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                      <CheckSquare size={14} className="text-orange-500" />
                      Tarefas ({linkedTasks.length})
                    </h3>
                    <Button variant="primary" size="sm" icon={<ListPlus size={14} />} onClick={openNewTask}>
                      Nova
                    </Button>
                  </div>

                  {loadingTasks ? (
                    <div className="flex items-center justify-center py-8 text-xs text-[var(--text-muted)]">
                      <Loader2 size={14} className="mr-2 animate-spin" />
                      Carregando tarefas…
                    </div>
                  ) : linkedTasks.length === 0 ? (
                    <p className="py-8 text-center text-xs text-[var(--text-muted)]">Nenhuma tarefa vinculada.</p>
                  ) : (
                    <>
                      {/* Pending tasks */}
                      {pendingTasks.length > 0 && (
                        <div className="mb-4">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-500">
                            Pendentes ({pendingTasks.length})
                          </p>
                          <div className="space-y-2">
                            {pendingTasks.map((t) => (
                              <TaskItem
                                key={t.id}
                                task={t}
                                editing={editingTaskId === t.id}
                                editTitle={editTaskTitle}
                                editDueAt={editTaskDueAt}
                                onToggle={() => handleToggleTask(t.id)}
                                onStartEdit={() => handleEditTask(t)}
                                onSaveEdit={handleSaveTaskEdit}
                                onCancelEdit={() => setEditingTaskId(null)}
                                onEditTitleChange={setEditTaskTitle}
                                onEditDueAtChange={setEditTaskDueAt}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Completed tasks */}
                      {completedTasks.length > 0 && (
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-500">
                            Concluídas ({completedTasks.length})
                          </p>
                          <div className="space-y-2">
                            {completedTasks.map((t) => (
                              <TaskItem
                                key={t.id}
                                task={t}
                                editing={editingTaskId === t.id}
                                editTitle={editTaskTitle}
                                editDueAt={editTaskDueAt}
                                onToggle={() => handleToggleTask(t.id)}
                                onStartEdit={() => handleEditTask(t)}
                                onSaveEdit={handleSaveTaskEdit}
                                onCancelEdit={() => setEditingTaskId(null)}
                                onEditTitleChange={setEditTaskTitle}
                                onEditDueAtChange={setEditTaskDueAt}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {/* ===== NOTES TAB ===== */}
              {activeTab === "notes" && (
                <>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                    <StickyNote size={14} className="text-orange-500" />
                    Notas
                  </h3>

                  <div className="mb-4 flex flex-col gap-2">
                    <textarea
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      placeholder="Adicionar uma nota sobre este deal..."
                      rows={3}
                      className="w-full resize-none rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus:border-[var(--border-focus)] focus:outline-none"
                    />
                    <div className="flex justify-end">
                      <Button variant="primary" size="sm" icon={<Send size={12} />} onClick={handleAddNote} disabled={!noteInput.trim() || savingNote}>
                        {savingNote ? "Salvando…" : "Adicionar"}
                      </Button>
                    </div>
                  </div>

                  {loadingNotes ? (
                    <div className="flex items-center justify-center py-4 text-xs text-[var(--text-muted)]">
                      <Loader2 size={14} className="mr-2 animate-spin" />
                      Carregando notas…
                    </div>
                  ) : notes.length === 0 ? (
                    <p className="py-4 text-center text-xs text-[var(--text-muted)]">Nenhuma nota ainda.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {notes.map((note) => (
                        <div key={note.id} className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] p-3">
                          <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{note.content}</p>
                          <p className="mt-2 text-xs text-[var(--text-muted)]">
                            {note.author_name ?? "Membro"} · {formatRelative(note.created_at)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ===== ATTACHMENTS TAB ===== */}
              {activeTab === "attachments" && (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                      <Paperclip size={14} className="text-orange-500" />
                      Anexos
                    </h3>
                    <div>
                      <input ref={fileInputRef} type="file" onChange={handleUpload} className="hidden" />
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<Upload size={14} />}
                        onClick={() => fileInputRef.current?.click()}
                        loading={uploading}
                      >
                        Enviar
                      </Button>
                    </div>
                  </div>

                  {loadingAttachments ? (
                    <div className="flex items-center justify-center py-8 text-xs text-[var(--text-muted)]">
                      <Loader2 size={14} className="mr-2 animate-spin" />
                      Carregando anexos…
                    </div>
                  ) : attachments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Paperclip size={24} className="mb-2 text-[var(--text-muted)]" />
                      <p className="text-xs text-[var(--text-muted)]">Nenhum anexo ainda.</p>
                      <p className="text-xs text-[var(--text-muted)]">Envie propostas, contratos ou apresentações.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] p-3"
                        >
                          <Paperclip size={16} className="shrink-0 text-[var(--text-muted)]" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                              {att.file_name}
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">
                              {formatFileSize(att.file_size)} · {formatRelative(att.created_at)}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDownload(att)}
                            className="rounded p-1 text-[var(--text-muted)] hover:text-orange-500 transition-colors"
                            title="Baixar"
                          >
                            <Download size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteAttachment(att)}
                            className="rounded p-1 text-[var(--text-muted)] hover:text-red-500 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.aside>

          {/* --- Edit Modal --- */}
          <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar Deal" className="max-w-md">
            <div className="flex flex-col gap-4">
              <div><label className={labelClass}>Título</label><input type="text" value={editForm.title} onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))} className={inputClass} /></div>
              <div><label className={labelClass}>Valor (R$)</label><input type="number" value={editForm.value} onChange={(e) => setEditForm((p) => ({ ...p, value: e.target.value }))} className={inputClass} /></div>
              <div>
                <label className={labelClass}>Prioridade</label>
                <div className="flex gap-2">
                  {(["HIGH", "MEDIUM", "LOW"] as Priority[]).map((p) => (
                    <button key={p} type="button" onClick={() => setEditForm((prev) => ({ ...prev, priority: p }))} className={cn("rounded-md px-3 py-1.5 text-xs font-medium transition-colors", editForm.priority === p ? "bg-orange-500 text-white" : "bg-[var(--bg-base)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]")}>{priorityLabel[p]}</button>
                  ))}
                </div>
              </div>
              <div><label className={labelClass}>Contato *</label><select value={editForm.contact_id} onChange={(e) => setEditForm((p) => ({ ...p, contact_id: e.target.value }))} className={inputClass}><option value="">Selecionar contato...</option>{contacts.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}</select></div>
              {!isB2C && (<div><label className={labelClass}>Empresa</label><select value={editForm.company_id} onChange={(e) => setEditForm((p) => ({ ...p, company_id: e.target.value }))} className={inputClass}><option value="">Nenhuma</option>{companies.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}</select></div>)}
              <div><label className={labelClass}>Responsável</label><select value={editForm.assigned_to_id} onChange={(e) => setEditForm((p) => ({ ...p, assigned_to_id: e.target.value }))} className={inputClass}><option value="">Nenhum</option>{teamMembers.map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}</select></div>
              <CustomFieldsForm entityType="deal" entityId={fullDeal?.id} values={editCustomFields} onChange={setEditCustomFields} />
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" size="sm" onClick={() => setEditOpen(false)} disabled={editSaving}>Cancelar</Button>
                <Button variant="primary" size="sm" onClick={handleEditSave} loading={editSaving}>Salvar</Button>
              </div>
            </div>
          </Modal>

          {/* --- Move Stage Modal --- */}
          <Modal open={moveOpen} onClose={() => setMoveOpen(false)} title="Mover Etapa" className="max-w-md">
            <div className="flex flex-col gap-4">
              <div><label className={labelClass}>Nova etapa</label><select value={targetStageId} onChange={(e) => setTargetStageId(e.target.value)} className={inputClass}>{stages.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}</select></div>
              {requiresLossReason && (
                <div>
                  <label className={labelClass}>Motivo da perda *</label>
                  <select value={lossReason} onChange={(e) => setLossReason(e.target.value)} className={inputClass}>
                    <option value="">Selecione um motivo</option>
                    {lossReasonOptions.map((r) => (<option key={r.id} value={r.name}>{r.name}</option>))}
                  </select>
                  {lossReasonOptions.length === 0 && <p className="mt-1 text-xs text-[var(--text-muted)]">Nenhum motivo cadastrado. Cadastre em Configurações → Motivos de Perda.</p>}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" size="sm" onClick={() => setMoveOpen(false)} disabled={moving}>Cancelar</Button>
                <Button variant={requiresLossReason ? "danger" : "primary"} size="sm" onClick={handleMoveSave} loading={moving}>{requiresLossReason ? "Confirmar Perda" : "Mover"}</Button>
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

// --- Sub-components ---

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[var(--text-muted)] mb-1">{label}</p>
      <p className="text-sm font-medium text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

function TaskItem({
  task,
  editing,
  editTitle,
  editDueAt,
  onToggle,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditTitleChange,
  onEditDueAtChange,
}: {
  task: LinkedTask;
  editing: boolean;
  editTitle: string;
  editDueAt: string;
  onToggle: () => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditTitleChange: (v: string) => void;
  onEditDueAtChange: (v: string) => void;
}) {
  const isCompleted = task.status === "COMPLETED";
  const isOverdue = task.status === "OVERDUE";

  if (editing) {
    return (
      <div className="rounded-lg border border-[var(--border-focus)] bg-[var(--bg-elevated)] p-3 space-y-2">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => onEditTitleChange(e.target.value)}
          className="w-full rounded border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-1.5 text-sm text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none"
          autoFocus
          onKeyDown={(e) => { if (e.key === "Enter") onSaveEdit(); if (e.key === "Escape") onCancelEdit(); }}
        />
        <input
          type="datetime-local"
          value={editDueAt}
          onChange={(e) => onEditDueAtChange(e.target.value)}
          className="w-full rounded border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-1.5 text-sm text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none"
        />
        <div className="flex justify-end gap-1">
          <button onClick={onCancelEdit} className="rounded px-2 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Cancelar</button>
          <button onClick={onSaveEdit} className="rounded bg-orange-500 px-2 py-1 text-xs font-medium text-white hover:bg-orange-600">Salvar</button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] p-2.5",
      isOverdue && "border-red-500/30",
    )}>
      <button
        onClick={onToggle}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
          isCompleted
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-[var(--border-default)] hover:border-orange-500",
        )}
      >
        {isCompleted && <Check size={12} />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn(
          "text-sm text-[var(--text-primary)]",
          isCompleted && "line-through text-[var(--text-muted)]",
        )}>
          {task.title}
        </p>
        <p className={cn(
          "text-xs",
          isOverdue ? "text-red-400" : "text-[var(--text-muted)]",
        )}>
          {new Date(task.due_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
      <button
        onClick={onStartEdit}
        className="rounded p-1 text-[var(--text-muted)] hover:text-orange-500 transition-colors"
        title="Editar"
      >
        <Pencil size={12} />
      </button>
    </div>
  );
}

export { DealDetailPanel };
