"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { Badge, Button, Modal, useToast } from "@/components/ui";
import { Card } from "@/components/ui";
import { fadeIn, staggerContainer, staggerChild } from "@/lib/motion";
import { cn } from "@/lib/cn";

interface DistributionRule {
  id: string;
  name: string;
  description: string | null;
  rule_type: RuleType;
  rule_config: Record<string, unknown>;
  is_active: boolean;
  priority: number;
  created_at: string;
}

type RuleType =
  | "round_robin"
  | "weighted"
  | "territory"
  | "segment"
  | "value_based"
  | "hybrid"
  | "custom";

const RULE_TYPE_LABELS: Record<RuleType, string> = {
  round_robin: "Round Robin",
  weighted: "Por Peso",
  territory: "Por Território",
  segment: "Por Segmento",
  value_based: "Por Valor",
  hybrid: "Híbrido",
  custom: "Customizado",
};

const inputClass =
  "w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] transition-colors focus:border-[var(--border-focus)] focus:outline-none";
const labelClass = "mb-1 block text-xs font-medium text-[var(--text-secondary)]";
const selectClass =
  "w-full appearance-none rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2.5 pr-8 text-sm text-[var(--text-primary)] transition-colors focus:border-[var(--border-focus)] focus:outline-none";

type ModalState =
  | { kind: "create" }
  | { kind: "edit"; rule: DistributionRule }
  | null;

export function LeadDistributionTab() {
  const { toast } = useToast();
  const [rules, setRules] = useState<DistributionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formRuleType, setFormRuleType] = useState<RuleType>("round_robin");
  const [formPriority, setFormPriority] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/lead-distribution");
      const json = await res.json();
      if (!res.ok) {
        toast(json.error || "Erro ao carregar regras", "error");
        return;
      }
      setRules(json as DistributionRule[]);
    } catch {
      toast("Erro de conexão", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setModal({ kind: "create" });
    setFormName("");
    setFormDescription("");
    setFormRuleType("round_robin");
    setFormPriority(rules.length + 1);
  };

  const openEdit = (rule: DistributionRule) => {
    setModal({ kind: "edit", rule });
    setFormName(rule.name);
    setFormDescription(rule.description || "");
    setFormRuleType(rule.rule_type);
    setFormPriority(rule.priority);
  };

  const closeModal = () => {
    setModal(null);
  };

  const handleSave = useCallback(async () => {
    if (!modal) return;
    if (!formName.trim()) {
      toast("Nome é obrigatório", "warning");
      return;
    }

    setSaving(true);
    const payload: Record<string, unknown> = {
      name: formName.trim(),
      description: formDescription.trim() || null,
      rule_type: formRuleType,
      priority: formPriority,
    };

    try {
      const res =
        modal.kind === "create"
          ? await fetch("/api/lead-distribution", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })
          : await fetch(`/api/lead-distribution/${modal.rule.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
      const json = await res.json();
      if (!res.ok) {
        toast(json.error || "Erro ao salvar", "error");
        return;
      }
      toast("Salvo", "success");
      closeModal();
      await load();
    } catch {
      toast("Erro de conexão", "error");
    } finally {
      setSaving(false);
    }
  }, [modal, formName, formDescription, formRuleType, formPriority, toast, load]);

  const handleToggleActive = useCallback(
    async (rule: DistributionRule) => {
      const next = !rule.is_active;
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, is_active: next } : r)),
      );
      try {
        const res = await fetch(`/api/lead-distribution/${rule.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: next }),
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          toast(json.error || "Erro ao atualizar", "error");
          setRules((prev) =>
            prev.map((r) =>
              r.id === rule.id ? { ...r, is_active: rule.is_active } : r,
            ),
          );
        }
      } catch {
        toast("Erro de conexão", "error");
        setRules((prev) =>
          prev.map((r) =>
            r.id === rule.id ? { ...r, is_active: rule.is_active } : r,
          ),
        );
      }
    },
    [toast],
  );

  const handleDelete = useCallback(
    async (rule: DistributionRule) => {
      if (!window.confirm(`Excluir a regra "${rule.name}"?`)) return;
      try {
        const res = await fetch(`/api/lead-distribution/${rule.id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          toast(json.error || "Erro ao excluir", "error");
          return;
        }
        toast("Regra excluída", "success");
        await load();
      } catch {
        toast("Erro de conexão", "error");
      }
    },
    [toast, load],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[var(--text-muted)]">
        <Loader2 size={18} className="mr-2 animate-spin" />
        Carregando regras…
      </div>
    );
  }

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Distribuição de Leads
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Configure regras automáticas para distribuir leads entre vendedores.
          </p>
        </div>
        <Button size="sm" icon={<Plus size={14} />} onClick={openCreate}>
          Nova Regra
        </Button>
      </div>

      {rules.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--text-muted)]">
          Nenhuma regra de distribuição cadastrada.
        </p>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {rules.map((rule) => (
            <motion.div key={rule.id} variants={staggerChild}>
              <Card hoverable={false} className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500/10">
                      <RefreshCw size={18} className="text-orange-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                          {rule.name}
                        </h3>
                        <Badge variant="default" size="sm">
                          {rule.priority}ª
                        </Badge>
                        <Badge variant="default" size="sm">
                          {RULE_TYPE_LABELS[rule.rule_type]}
                        </Badge>
                      </div>
                      {rule.description && (
                        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                          {rule.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(rule)}
                      className={cn(
                        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                        rule.is_active ? "bg-orange-500" : "bg-neutral-700",
                      )}
                      aria-label="Alternar ativo"
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                          rule.is_active && "translate-x-5",
                        )}
                      />
                    </button>
                    <button
                      onClick={() => openEdit(rule)}
                      className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                      aria-label="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(rule)}
                      className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-red-400"
                      aria-label="Excluir"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 border-t border-[var(--border-default)] pt-3 text-xs text-[var(--text-muted)]">
                  <Badge
                    variant={rule.is_active ? "success" : "default"}
                    size="sm"
                  >
                    {rule.is_active ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      <Modal
        open={modal !== null}
        onClose={closeModal}
        title={modal?.kind === "edit" ? "Editar Regra" : "Nova Regra de Distribuição"}
        className="max-w-md"
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Nome</label>
            <input
              autoFocus
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Ex: Round Robin, Por Território"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Descrição</label>
            <input
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Descreva como essa regra funciona"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Tipo de Regra</label>
            <div className="relative">
              <select
                value={formRuleType}
                onChange={(e) => setFormRuleType(e.target.value as RuleType)}
                className={selectClass}
              >
                {(Object.keys(RULE_TYPE_LABELS) as RuleType[]).map((rt) => (
                  <option key={rt} value={rt}>
                    {RULE_TYPE_LABELS[rt]}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[var(--text-muted)]"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Prioridade</label>
            <input
              type="number"
              min={1}
              value={formPriority}
              onChange={(e) => setFormPriority(parseInt(e.target.value) || 0)}
              className={inputClass}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={closeModal}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} loading={saving}>
              Salvar
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
