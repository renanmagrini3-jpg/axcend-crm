"use client";

import { useState, type FormEvent } from "react";
import { Modal, Button } from "@/components/ui";
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
}

// --- Mock options ---

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

const contactOptions = [
  { value: "c1", label: "Lucas Ferreira" },
  { value: "c2", label: "Mariana Costa" },
  { value: "c3", label: "Rafael Oliveira" },
  { value: "c4", label: "Camila Santos" },
  { value: "c5", label: "Pedro Almeida" },
];

const dealOptions = [
  { value: "", label: "Nenhum" },
  { value: "d1", label: "Implantação ERP — TechCorp" },
  { value: "d2", label: "Licença Anual — StartupXYZ" },
  { value: "d3", label: "Consultoria — Global Ind." },
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

function NewTaskModal({ open, onClose }: NewTaskModalProps) {
  const [form, setForm] = useState<NewTaskFormData>(initialForm);

  function update<K extends keyof NewTaskFormData>(key: K, value: NewTaskFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // TODO: persist task via API
    setForm(initialForm);
    onClose();
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
          <label className={labelClass}>Título</label>
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
          <label className={labelClass}>Data e Hora</label>
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
            required
            value={form.contactId}
            onChange={(e) => update("contactId", e.target.value)}
            className={selectClass}
          >
            <option value="" disabled>
              Selecione um contato
            </option>
            {contactOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
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
            {dealOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
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
          <Button type="submit" variant="primary" size="sm">
            Criar Tarefa
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export { NewTaskModal, type NewTaskModalProps };
