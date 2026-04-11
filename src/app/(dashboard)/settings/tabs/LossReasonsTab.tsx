"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge, Button, Modal, useToast } from "@/components/ui";
import { fadeIn, staggerContainer, staggerChild } from "@/lib/motion";
import { cn } from "@/lib/cn";

interface LossReason {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

const inputClass =
  "w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] transition-colors focus:border-[var(--border-focus)] focus:outline-none";
const labelClass = "mb-1 block text-xs font-medium text-[var(--text-secondary)]";

type ModalState =
  | { kind: "create" }
  | { kind: "edit"; id: string; current: string }
  | null;

export function LossReasonsTab() {
  const { toast } = useToast();
  const [reasons, setReasons] = useState<LossReason[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>(null);
  const [modalName, setModalName] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/loss-reasons");
      const json = await res.json();
      if (!res.ok) {
        toast(json.error || "Erro ao carregar motivos", "error");
        return;
      }
      setReasons(json as LossReason[]);
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
    setModalName("");
  };

  const openEdit = (r: LossReason) => {
    setModal({ kind: "edit", id: r.id, current: r.name });
    setModalName(r.name);
  };

  const closeModal = () => {
    setModal(null);
    setModalName("");
  };

  const handleSave = useCallback(async () => {
    if (!modal) return;
    if (!modalName.trim()) {
      toast("Nome é obrigatório", "warning");
      return;
    }
    setSaving(true);
    try {
      const res =
        modal.kind === "create"
          ? await fetch("/api/loss-reasons", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: modalName.trim() }),
            })
          : await fetch(`/api/loss-reasons/${modal.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: modalName.trim() }),
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
  }, [modal, modalName, toast, load]);

  const handleToggleActive = useCallback(
    async (reason: LossReason) => {
      const next = !reason.is_active;
      setReasons((prev) =>
        prev.map((r) => (r.id === reason.id ? { ...r, is_active: next } : r)),
      );
      try {
        const res = await fetch(`/api/loss-reasons/${reason.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: next }),
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          toast(json.error || "Erro ao atualizar", "error");
          setReasons((prev) =>
            prev.map((r) =>
              r.id === reason.id ? { ...r, is_active: reason.is_active } : r,
            ),
          );
        }
      } catch {
        toast("Erro de conexão", "error");
        setReasons((prev) =>
          prev.map((r) =>
            r.id === reason.id ? { ...r, is_active: reason.is_active } : r,
          ),
        );
      }
    },
    [toast],
  );

  const handleDelete = useCallback(
    async (reason: LossReason) => {
      if (!window.confirm(`Excluir o motivo "${reason.name}"?`)) return;
      try {
        const res = await fetch(`/api/loss-reasons/${reason.id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          toast(json.error || "Erro ao excluir", "error");
          return;
        }
        toast("Motivo excluído", "success");
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
        Carregando motivos…
      </div>
    );
  }

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Motivos de Perda</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Configure os motivos utilizados ao marcar deals como perdidos.
          </p>
        </div>
        <Button size="sm" icon={<Plus size={14} />} onClick={openCreate}>
          Novo Motivo
        </Button>
      </div>

      {reasons.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--text-muted)]">
          Nenhum motivo cadastrado.
        </p>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-2"
        >
          {reasons.map((reason) => (
            <motion.div
              key={reason.id}
              variants={staggerChild}
              className="flex items-center gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-3"
            >
              <span className="flex-1 text-sm text-[var(--text-primary)]">
                {reason.name}
              </span>
              <Badge
                variant={reason.is_active ? "success" : "default"}
                size="sm"
              >
                {reason.is_active ? "Ativo" : "Inativo"}
              </Badge>
              <button
                type="button"
                onClick={() => handleToggleActive(reason)}
                className={cn(
                  "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                  reason.is_active ? "bg-orange-500" : "bg-neutral-700",
                )}
                aria-label="Alternar ativo"
              >
                <span
                  className={cn(
                    "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                    reason.is_active && "translate-x-4",
                  )}
                />
              </button>
              <button
                type="button"
                onClick={() => openEdit(reason)}
                className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
                aria-label="Editar"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(reason)}
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
        title={modal?.kind === "edit" ? "Editar Motivo" : "Novo Motivo"}
        className="max-w-md"
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Nome</label>
            <input
              autoFocus
              value={modalName}
              onChange={(e) => setModalName(e.target.value)}
              placeholder="Ex: Preço alto"
              className={inputClass}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
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
