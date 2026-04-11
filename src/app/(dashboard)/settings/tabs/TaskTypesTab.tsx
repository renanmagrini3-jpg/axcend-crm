"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge, Button, Modal, useToast } from "@/components/ui";
import { fadeIn, staggerContainer, staggerChild } from "@/lib/motion";
import { cn } from "@/lib/cn";

interface TaskType {
  id: string;
  name: string;
  icon: string | null;
  is_active: boolean;
  created_at: string;
}

const inputClass =
  "w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] transition-colors focus:border-[var(--border-focus)] focus:outline-none";
const labelClass = "mb-1 block text-xs font-medium text-[var(--text-secondary)]";

type ModalState =
  | { kind: "create" }
  | { kind: "edit"; id: string }
  | null;

export function TaskTypesTab() {
  const { toast } = useToast();
  const [types, setTypes] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>(null);
  const [formName, setFormName] = useState("");
  const [formIcon, setFormIcon] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/task-types");
      const json = await res.json();
      if (!res.ok) {
        toast(json.error || "Erro ao carregar tipos", "error");
        return;
      }
      setTypes(json as TaskType[]);
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
    setFormIcon("");
  };

  const openEdit = (t: TaskType) => {
    setModal({ kind: "edit", id: t.id });
    setFormName(t.name);
    setFormIcon(t.icon ?? "");
  };

  const closeModal = () => {
    setModal(null);
    setFormName("");
    setFormIcon("");
  };

  const handleSave = useCallback(async () => {
    if (!modal) return;
    if (!formName.trim()) {
      toast("Nome é obrigatório", "warning");
      return;
    }
    setSaving(true);
    try {
      const payload = { name: formName.trim(), icon: formIcon.trim() || null };
      const res =
        modal.kind === "create"
          ? await fetch("/api/task-types", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })
          : await fetch(`/api/task-types/${modal.id}`, {
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
  }, [modal, formName, formIcon, toast, load]);

  const handleToggleActive = useCallback(
    async (type: TaskType) => {
      const next = !type.is_active;
      setTypes((prev) =>
        prev.map((t) => (t.id === type.id ? { ...t, is_active: next } : t)),
      );
      try {
        const res = await fetch(`/api/task-types/${type.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: next }),
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          toast(json.error || "Erro ao atualizar", "error");
          setTypes((prev) =>
            prev.map((t) =>
              t.id === type.id ? { ...t, is_active: type.is_active } : t,
            ),
          );
        }
      } catch {
        toast("Erro de conexão", "error");
        setTypes((prev) =>
          prev.map((t) =>
            t.id === type.id ? { ...t, is_active: type.is_active } : t,
          ),
        );
      }
    },
    [toast],
  );

  const handleDelete = useCallback(
    async (type: TaskType) => {
      if (!window.confirm(`Excluir o tipo "${type.name}"?`)) return;
      try {
        const res = await fetch(`/api/task-types/${type.id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          toast(json.error || "Erro ao excluir", "error");
          return;
        }
        toast("Tipo excluído", "success");
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
        Carregando tipos…
      </div>
    );
  }

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Tipos de Tarefa</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Gerencie os tipos disponíveis ao criar uma tarefa.
          </p>
        </div>
        <Button size="sm" icon={<Plus size={14} />} onClick={openCreate}>
          Novo Tipo
        </Button>
      </div>

      {types.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--text-muted)]">
          Nenhum tipo cadastrado.
        </p>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-2"
        >
          {types.map((type) => (
            <motion.div
              key={type.id}
              variants={staggerChild}
              className="flex items-center gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-3"
            >
              <span className="flex-1 text-sm text-[var(--text-primary)]">
                {type.name}
              </span>
              {type.icon && (
                <span className="text-xs text-[var(--text-muted)]">{type.icon}</span>
              )}
              <Badge variant={type.is_active ? "success" : "default"} size="sm">
                {type.is_active ? "Ativo" : "Inativo"}
              </Badge>
              <button
                type="button"
                onClick={() => handleToggleActive(type)}
                className={cn(
                  "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                  type.is_active ? "bg-orange-500" : "bg-neutral-700",
                )}
                aria-label="Alternar ativo"
              >
                <span
                  className={cn(
                    "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                    type.is_active && "translate-x-4",
                  )}
                />
              </button>
              <button
                type="button"
                onClick={() => openEdit(type)}
                className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
                aria-label="Editar"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(type)}
                className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-surface)] hover:text-red-400"
                aria-label="Excluir"
              >
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
        </motion.div>
      )}

      <Modal
        open={modal !== null}
        onClose={closeModal}
        title={modal?.kind === "edit" ? "Editar Tipo" : "Novo Tipo"}
        className="max-w-md"
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Nome</label>
            <input
              autoFocus
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Ex: Ligação"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Ícone (opcional)</label>
            <input
              value={formIcon}
              onChange={(e) => setFormIcon(e.target.value)}
              placeholder="Ex: Phone, Mail, Calendar"
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
