"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Pencil, Plus, Trash2, ChevronDown } from "lucide-react";
import { Badge, Button, Modal, useToast } from "@/components/ui";
import { fadeIn, staggerContainer, staggerChild } from "@/lib/motion";
import { cn } from "@/lib/cn";

interface CustomField {
  id: string;
  entity_type: "deal" | "contact" | "company";
  field_name: string;
  field_type: "text" | "number" | "date" | "select" | "boolean";
  field_options: string[];
  is_required: boolean;
  is_active: boolean;
  field_order: number;
  created_at: string;
}

type EntityType = "deal" | "contact" | "company";
type FieldType = "text" | "number" | "date" | "select" | "boolean";

const ENTITY_LABELS: Record<EntityType, string> = {
  deal: "Deals",
  contact: "Contatos",
  company: "Empresas",
};

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: "Texto",
  number: "Número",
  date: "Data",
  select: "Seleção",
  boolean: "Sim/Não",
};

const inputClass =
  "w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] transition-colors focus:border-[var(--border-focus)] focus:outline-none";
const labelClass = "mb-1 block text-xs font-medium text-[var(--text-secondary)]";
const selectClass =
  "w-full appearance-none rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2.5 pr-8 text-sm text-[var(--text-primary)] transition-colors focus:border-[var(--border-focus)] focus:outline-none";

type ModalState =
  | { kind: "create" }
  | { kind: "edit"; field: CustomField }
  | null;

export function CustomFieldsTab() {
  const { toast } = useToast();
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formEntity, setFormEntity] = useState<EntityType>("deal");
  const [formType, setFormType] = useState<FieldType>("text");
  const [formRequired, setFormRequired] = useState(false);
  const [formOptions, setFormOptions] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/custom-fields");
      const json = await res.json();
      if (!res.ok) {
        toast(json.error || "Erro ao carregar campos", "error");
        return;
      }
      setFields(json as CustomField[]);
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
    setFormEntity("deal");
    setFormType("text");
    setFormRequired(false);
    setFormOptions("");
  };

  const openEdit = (f: CustomField) => {
    setModal({ kind: "edit", field: f });
    setFormName(f.field_name);
    setFormEntity(f.entity_type);
    setFormType(f.field_type);
    setFormRequired(f.is_required);
    setFormOptions(f.field_type === "select" ? f.field_options.join(", ") : "");
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
    if (formType === "select" && !formOptions.trim()) {
      toast("Opções são obrigatórias para campo tipo Seleção", "warning");
      return;
    }

    setSaving(true);
    const payload: Record<string, unknown> = {
      field_name: formName.trim(),
      entity_type: formEntity,
      field_type: formType,
      is_required: formRequired,
      field_options:
        formType === "select"
          ? formOptions
              .split(",")
              .map((o) => o.trim())
              .filter(Boolean)
          : [],
    };

    try {
      const res =
        modal.kind === "create"
          ? await fetch("/api/custom-fields", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })
          : await fetch(`/api/custom-fields/${modal.field.id}`, {
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
  }, [modal, formName, formEntity, formType, formRequired, formOptions, toast, load]);

  const handleToggleActive = useCallback(
    async (field: CustomField) => {
      const next = !field.is_active;
      setFields((prev) =>
        prev.map((f) => (f.id === field.id ? { ...f, is_active: next } : f)),
      );
      try {
        const res = await fetch(`/api/custom-fields/${field.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: next }),
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          toast(json.error || "Erro ao atualizar", "error");
          setFields((prev) =>
            prev.map((f) =>
              f.id === field.id ? { ...f, is_active: field.is_active } : f,
            ),
          );
        }
      } catch {
        toast("Erro de conexão", "error");
        setFields((prev) =>
          prev.map((f) =>
            f.id === field.id ? { ...f, is_active: field.is_active } : f,
          ),
        );
      }
    },
    [toast],
  );

  const handleDelete = useCallback(
    async (field: CustomField) => {
      if (!window.confirm(`Excluir o campo "${field.field_name}"?`)) return;
      try {
        const res = await fetch(`/api/custom-fields/${field.id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          toast(json.error || "Erro ao excluir", "error");
          return;
        }
        toast("Campo excluído", "success");
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
        Carregando campos…
      </div>
    );
  }

  const grouped = (["deal", "contact", "company"] as EntityType[]).map((entity) => ({
    entity,
    label: ENTITY_LABELS[entity],
    items: fields.filter((f) => f.entity_type === entity),
  }));

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Campos Customizados
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Crie campos personalizados para Deals, Contatos e Empresas.
          </p>
        </div>
        <Button size="sm" icon={<Plus size={14} />} onClick={openCreate}>
          Novo Campo
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--text-muted)]">
          Nenhum campo customizado cadastrado.
        </p>
      ) : (
        <div className="space-y-6">
          {grouped
            .filter((g) => g.items.length > 0)
            .map((group) => (
              <div key={group.entity}>
                <h3 className="mb-3 text-sm font-semibold text-[var(--text-secondary)]">
                  {group.label}
                </h3>
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="space-y-2"
                >
                  {group.items.map((field) => (
                    <motion.div
                      key={field.id}
                      variants={staggerChild}
                      className="flex items-center gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-[var(--text-primary)]">
                            {field.field_name}
                          </span>
                          <Badge variant="default" size="sm">
                            {FIELD_TYPE_LABELS[field.field_type]}
                          </Badge>
                          {field.is_required && (
                            <Badge variant="warning" size="sm">
                              Obrigatório
                            </Badge>
                          )}
                        </div>
                        {field.field_type === "select" &&
                          field.field_options.length > 0 && (
                            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                              Opções: {field.field_options.join(", ")}
                            </p>
                          )}
                      </div>

                      <Badge
                        variant={field.is_active ? "success" : "default"}
                        size="sm"
                      >
                        {field.is_active ? "Ativo" : "Inativo"}
                      </Badge>

                      <button
                        type="button"
                        onClick={() => handleToggleActive(field)}
                        className={cn(
                          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                          field.is_active ? "bg-orange-500" : "bg-neutral-700",
                        )}
                        aria-label="Alternar ativo"
                      >
                        <span
                          className={cn(
                            "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                            field.is_active && "translate-x-4",
                          )}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() => openEdit(field)}
                        className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
                        aria-label="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(field)}
                        className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-surface)] hover:text-red-400"
                        aria-label="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            ))}
        </div>
      )}

      <Modal
        open={modal !== null}
        onClose={closeModal}
        title={modal?.kind === "edit" ? "Editar Campo" : "Novo Campo Customizado"}
        className="max-w-md"
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Nome do Campo</label>
            <input
              autoFocus
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Ex: CNPJ, Segmento, Data de Nascimento"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Entidade</label>
            <div className="relative">
              <select
                value={formEntity}
                onChange={(e) => setFormEntity(e.target.value as EntityType)}
                className={selectClass}
                disabled={modal?.kind === "edit"}
              >
                <option value="deal">Deals</option>
                <option value="contact">Contatos</option>
                <option value="company">Empresas</option>
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[var(--text-muted)]"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Tipo</label>
            <div className="relative">
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as FieldType)}
                className={selectClass}
              >
                {(Object.keys(FIELD_TYPE_LABELS) as FieldType[]).map((ft) => (
                  <option key={ft} value={ft}>
                    {FIELD_TYPE_LABELS[ft]}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[var(--text-muted)]"
              />
            </div>
          </div>

          {formType === "select" && (
            <div>
              <label className={labelClass}>Opções (separadas por vírgula)</label>
              <input
                value={formOptions}
                onChange={(e) => setFormOptions(e.target.value)}
                placeholder="Ex: Pequeno, Médio, Grande"
                className={inputClass}
              />
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={formRequired}
              onChange={(e) => setFormRequired(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--border-default)] accent-orange-500"
            />
            Campo obrigatório
          </label>

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
