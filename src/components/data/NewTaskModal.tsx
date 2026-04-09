"use client";

import { useState, useEffect, type FormEvent } from "react";
import { Modal, Button, useToast } from "@/components/ui";
import type { TaskType, Priority } from "@/types";

// --- Types ---

interface NewTaskFormData {
  title: string;
  type: TaskType;
  priority: Priority;
  dueDate: string;
  contactId: string;
  dealId: string;
  notes: string;
}

interface NewTaskModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

// --- Options ---

const typeOptions: { value: TaskType; label: string }[] = [
  { value: "CALL", label: "Ligação" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "EMAIL", label: "E-mail" },
  { value: "MEETING", label: "Reunião" },
  { value: "FOLLOW_UP", label: "Follow-up" },
  { value: "PROPOSAL", label: "Proposta" },
  { value: "CUSTOM", label: "Personalizada" },
];

const priorityOptions: { value: Priority; label: string }[] = [
  { value: "HIGH", label: "Alta" },
  { value: "MEDIUM", label: "Média" },
  { value: "LOW", label: "Baixa" },
];

// --- Styles ---

const selectClass =
  "w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none transition-colors";

const labelClass = "mb-1 block text-xs font-medium text-[var(--text-secondary)]";

// --- Component ---

const initialForm: NewTaskFormData = {
  title: "",
  type: "CALL",
  priority: "MEDIUM",
  dueDate: "",
  contactId: "",
  dealId: "",
  notes: "",
};

function NewTaskModal({ open, onClose, onCreated }: NewTaskModalProps) {
  const { toast } = useToast();
  const [form, setForm] = useState<NewTaskFormData>(initialForm);
  const [saving, setSaving] = useState(false);
  const [contacts, setContacts] = useState<{ id: string; name: string }[]>([]);
  const [deals, setDeals] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    if (!open) return;

    async function loadOptions() {
      try {
        const [contactsRes, dealsRes] = await Promise.all([
          fetch("/api/contacts?limit=100"),
          fetch("/api/deals?limit=100"),
        ]);
        const contactsJson = await contactsRes.json();
        const dealsJson = await dealsRes.json();

        if (contactsRes.ok) {
          setContacts(
            (contactsJson.data ?? []).map((c: { id: string; name: string }) => ({
              id: c.id,
              name: c.name,
            })),
          );
        }
        if (dealsRes.ok) {
          setDeals(
            (dealsJson.data ?? []).map((d: { id: string; title: string }) => ({
              id: d.id,
              title: d.title,
            })),
          );
        }
      } catch {
        /* ignore - selects will just be empty */
      }
    }
    loadOptions();
  }, [open]);

  function update<K extends keyof NewTaskFormData>(key: K, value: NewTaskFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast("Título é obrigatório", "warning");
      return;
    }
    if (!form.dueDate) {
      toast("Data é obrigatória", "warning");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          type: form.type,
          priority: form.priority,
          due_at: new Date(form.dueDate).toISOString(),
          contact_id: form.contactId || null,
          deal_id: form.dealId || null,
          notes: form.notes || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast(json.error || "Erro ao criar tarefa", "error");
        return;
      }

      toast("Tarefa criada com sucesso!", "success");
      setForm(initialForm);
      onCreated?.();
    } catch {
      toast("Erro de conexão", "error");
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    setForm(initialForm);
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Nova Tarefa" className="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Título */}
        <div>
          <label className={labelClass}>Título *</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="Ex: Ligar para confirmar reunião"
            className={selectClass}
          />
        </div>

        {/* Tipo + Prioridade */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Tipo</label>
            <select
              value={form.type}
              onChange={(e) => update("type", e.target.value as TaskType)}
              className={selectClass}
            >
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Prioridade</label>
            <select
              value={form.priority}
              onChange={(e) => update("priority", e.target.value as Priority)}
              className={selectClass}
            >
              {priorityOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Data/Hora */}
        <div>
          <label className={labelClass}>Data e Hora *</label>
          <input
            type="datetime-local"
            required
            value={form.dueDate}
            onChange={(e) => update("dueDate", e.target.value)}
            className={selectClass}
          />
        </div>

        {/* Contato */}
        <div>
          <label className={labelClass}>Contato Vinculado</label>
          <select
            value={form.contactId}
            onChange={(e) => update("contactId", e.target.value)}
            className={selectClass}
          >
            <option value="">Nenhum</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Deal (opcional) */}
        <div>
          <label className={labelClass}>Deal Vinculado (opcional)</label>
          <select
            value={form.dealId}
            onChange={(e) => update("dealId", e.target.value)}
            className={selectClass}
          >
            <option value="">Nenhum</option>
            {deals.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
        </div>

        {/* Notas */}
        <div>
          <label className={labelClass}>Notas</label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="Observações adicionais..."
            className={`${selectClass} resize-none`}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" size="sm" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={saving}>
            Criar Tarefa
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export { NewTaskModal, type NewTaskModalProps };
