"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Plus,
  Play,
  Pencil,
  Trash2,
  Clock,
  Activity,
  Mail,
  Bell,
  Target,
} from "lucide-react";
import { PageContainer } from "@/components/layout";
import { Card, Button, Badge, Modal, useToast } from "@/components/ui";
import { WorkflowBuilder } from "@/components/data/WorkflowBuilder";
import { staggerContainer, staggerChild } from "@/lib/motion";
import { cn } from "@/lib/cn";

type TriggerType =
  | "contact_created"
  | "deal_created"
  | "deal_stage_changed"
  | "task_overdue";

type FilterTab = "active" | "all" | "inactive";

interface AutomationStep {
  id: string;
  step_order: number;
  step_type: string;
  step_config: Record<string, unknown>;
}

interface AutomationApiRow {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  trigger_type: TriggerType;
  trigger_config: Record<string, unknown>;
  execution_count: number;
  last_executed_at: string | null;
  created_at: string;
  automation_steps: AutomationStep[] | null;
}

const TRIGGER_LABELS: Record<TriggerType, string> = {
  contact_created: "Quando um novo contato é cadastrado",
  deal_created: "Quando um novo deal é criado",
  deal_stage_changed: "Quando um deal muda de etapa",
  task_overdue: "Quando uma tarefa fica atrasada",
};

const TRIGGER_ICONS: Record<TriggerType, typeof Zap> = {
  contact_created: Mail,
  deal_created: Target,
  deal_stage_changed: Activity,
  task_overdue: Bell,
};

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "active", label: "Ativas" },
  { key: "all", label: "Todas" },
  { key: "inactive", label: "Inativas" },
];

function formatRelative(iso: string | null): string {
  if (!iso) return "Nunca executada";
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

interface FormState {
  name: string;
  description: string;
  trigger_type: TriggerType;
  is_active: boolean;
}

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  trigger_type: "contact_created",
  is_active: true,
};

export default function AutomationsPage() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<FilterTab>("all");
  const [automations, setAutomations] = useState<AutomationApiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchAutomations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/automations?limit=100");
      const json = await res.json();
      if (!res.ok) {
        toast(json.error || "Erro ao carregar automações", "error");
        return;
      }
      setAutomations((json.data ?? []) as AutomationApiRow[]);
    } catch {
      toast("Erro de conexão", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAutomations();
  }, [fetchAutomations]);

  const filtered =
    filter === "all"
      ? automations
      : filter === "active"
        ? automations.filter((a) => a.is_active)
        : automations.filter((a) => !a.is_active);

  const toggleStatus = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/automations/${id}/toggle`, {
          method: "PATCH",
        });
        const json = await res.json();
        if (!res.ok) {
          toast(json.error || "Erro ao alternar status", "error");
          return;
        }
        setAutomations((prev) =>
          prev.map((a) => (a.id === id ? (json as AutomationApiRow) : a)),
        );
      } catch {
        toast("Erro de conexão", "error");
      }
    },
    [toast],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/automations/${id}`, { method: "DELETE" });
        if (!res.ok && res.status !== 204) {
          const json = await res.json().catch(() => ({}));
          toast(json.error || "Erro ao excluir automação", "error");
          return;
        }
        setAutomations((prev) => prev.filter((a) => a.id !== id));
        toast("Automação excluída", "success");
      } catch {
        toast("Erro de conexão", "error");
      }
    },
    [toast],
  );

  const handleExecute = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/automations/${id}/execute`, {
          method: "POST",
        });
        const json = await res.json();
        if (!res.ok) {
          toast(json.error || "Erro ao executar automação", "error");
          return;
        }
        setAutomations((prev) =>
          prev.map((a) => (a.id === id ? (json as AutomationApiRow) : a)),
        );
        toast("Automação executada", "success");
      } catch {
        toast("Erro de conexão", "error");
      }
    },
    [toast],
  );

  const openNew = useCallback(() => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((automation: AutomationApiRow) => {
    setEditingId(automation.id);
    setForm({
      name: automation.name,
      description: automation.description ?? "",
      trigger_type: automation.trigger_type,
      is_active: automation.is_active,
    });
    setModalOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) {
      toast("Informe um nome para a automação", "warning");
      return;
    }
    setSaving(true);
    try {
      const url = editingId
        ? `/api/automations/${editingId}`
        : "/api/automations";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          trigger_type: form.trigger_type,
          is_active: form.is_active,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast(json.error || "Erro ao salvar automação", "error");
        return;
      }
      if (editingId) {
        setAutomations((prev) =>
          prev.map((a) => (a.id === editingId ? (json as AutomationApiRow) : a)),
        );
        toast("Automação atualizada", "success");
      } else {
        setAutomations((prev) => [json as AutomationApiRow, ...prev]);
        toast("Automação criada", "success");
      }
      setModalOpen(false);
    } catch {
      toast("Erro de conexão", "error");
    } finally {
      setSaving(false);
    }
  }, [editingId, form, toast]);

  return (
    <PageContainer
      title="Automações"
      description="Automatize tarefas repetitivas e acelere seu processo comercial."
    >
      {/* Header actions */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                filter === tab.key
                  ? "bg-orange-500 text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Button icon={<Plus size={16} />} onClick={openNew}>
          Nova Automação
        </Button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-sm text-[var(--text-muted)]">
          Carregando automações…
        </div>
      )}

      {/* Automation cards */}
      {!loading && (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((automation) => {
              const Icon = TRIGGER_ICONS[automation.trigger_type] ?? Zap;
              return (
                <motion.div
                  key={automation.id}
                  variants={staggerChild}
                  layout
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4 lg:flex-1">
                      <div
                        className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
                          automation.is_active
                            ? "bg-orange-500/15 text-orange-500"
                            : "bg-neutral-500/15 text-[var(--text-muted)]",
                        )}
                      >
                        <Icon size={20} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                            {automation.name}
                          </h3>
                          <Badge
                            variant={automation.is_active ? "success" : "default"}
                            size="sm"
                          >
                            {automation.is_active ? "Ativa" : "Inativa"}
                          </Badge>
                        </div>
                        {automation.description && (
                          <p className="mb-2 text-sm text-[var(--text-secondary)] line-clamp-1">
                            {automation.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                          <span className="flex items-center gap-1">
                            <Zap size={12} />
                            {TRIGGER_LABELS[automation.trigger_type]}
                          </span>
                          <span className="flex items-center gap-1">
                            <Play size={12} />
                            {automation.execution_count} execuções
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatRelative(automation.last_executed_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 lg:shrink-0">
                      <button
                        onClick={() => toggleStatus(automation.id)}
                        className={cn(
                          "relative h-6 w-11 rounded-full transition-colors",
                          automation.is_active ? "bg-emerald-500" : "bg-neutral-600",
                        )}
                        aria-label={automation.is_active ? "Desativar" : "Ativar"}
                      >
                        <span
                          className={cn(
                            "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                            automation.is_active && "translate-x-5",
                          )}
                        />
                      </button>

                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Play size={14} />}
                        onClick={() => handleExecute(automation.id)}
                      >
                        Executar
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Pencil size={14} />}
                        onClick={() => openEdit(automation)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        icon={<Trash2 size={14} />}
                        onClick={() => handleDelete(automation.id)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="mt-12 flex flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/10">
            <Zap size={28} className="text-orange-500" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Nenhuma automação{" "}
            {filter === "active" ? "ativa" : filter === "inactive" ? "inativa" : ""}
          </h3>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Crie sua primeira automação para acelerar seu processo comercial.
          </p>
        </div>
      )}

      {/* New / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Editar Automação" : "Nova Automação"}
        className="max-w-3xl"
      >
        <div className="flex flex-col gap-5">
          <div className="grid gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                Nome
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex.: Boas-vindas ao lead"
                className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-orange-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                Descrição
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="O que esta automação faz?"
                rows={2}
                className="resize-none rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-orange-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                Gatilho
              </label>
              <select
                value={form.trigger_type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    trigger_type: e.target.value as TriggerType,
                  })
                }
                className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-orange-500"
              >
                {(Object.keys(TRIGGER_LABELS) as TriggerType[]).map((key) => (
                  <option key={key} value={key}>
                    {TRIGGER_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  setForm({ ...form, is_active: e.target.checked })
                }
                className="h-4 w-4 accent-orange-500"
              />
              Ativar automação imediatamente
            </label>
          </div>

          <div className="border-t border-[var(--border-default)] pt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              Pré-visualização do fluxo
            </p>
            <WorkflowBuilder />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-[var(--border-default)] pt-4">
            <Button
              variant="secondary"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando…" : editingId ? "Salvar" : "Criar Automação"}
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
