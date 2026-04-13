"use client";

import { useState, useEffect, useCallback } from "react";

// --- Types ---

export interface CustomFieldDef {
  id: string;
  field_name: string;
  field_type: "text" | "number" | "date" | "select" | "boolean";
  field_options: string[];
  is_required: boolean;
  field_order: number;
  is_active: boolean;
  entity_type: string;
}

export interface CustomFieldValueRecord {
  custom_field_id: string;
  value: string;
}

interface CustomFieldsFormProps {
  entityType: "deal" | "contact" | "company";
  /** When editing, pass the entity ID to load existing values */
  entityId?: string;
  /** Current values controlled externally */
  values: Record<string, string>;
  /** Called whenever a value changes */
  onChange: (values: Record<string, string>) => void;
  /** Fields are fetched internally, but expose them to parent */
  onFieldsLoaded?: (fields: CustomFieldDef[]) => void;
}

const inputClass =
  "w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none transition-colors";

const labelClass =
  "mb-1 block text-xs font-medium text-[var(--text-secondary)]";

function CustomFieldsForm({
  entityType,
  entityId,
  values,
  onChange,
  onFieldsLoaded,
}: CustomFieldsFormProps) {
  const [fields, setFields] = useState<CustomFieldDef[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch field definitions
  useEffect(() => {
    async function loadFields() {
      try {
        const res = await fetch(`/api/custom-fields?entity_type=${entityType}`);
        if (!res.ok) return;
        const data = await res.json();
        const active = (data as CustomFieldDef[]).filter((f) => f.is_active);
        setFields(active);
        onFieldsLoaded?.(active);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadFields();
  }, [entityType, onFieldsLoaded]);

  // Fetch existing values when editing
  useEffect(() => {
    if (!entityId) return;
    async function loadValues() {
      try {
        const res = await fetch(
          `/api/custom-field-values?entity_id=${entityId}&entity_type=${entityType}`,
        );
        if (!res.ok) return;
        const data = (await res.json()) as CustomFieldValueRecord[];
        const loaded: Record<string, string> = {};
        for (const v of data) {
          loaded[v.custom_field_id] = v.value;
        }
        onChange(loaded);
      } catch {
        // ignore
      }
    }
    loadValues();
    // Only run when entityId changes — onChange is stable from parent
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId, entityType]);

  const handleChange = useCallback(
    (fieldId: string, value: string) => {
      onChange({ ...values, [fieldId]: value });
    },
    [values, onChange],
  );

  if (loading || fields.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        Campos Personalizados
      </p>
      {fields.map((field) => {
        const val = values[field.id] ?? "";

        switch (field.field_type) {
          case "text":
            return (
              <div key={field.id}>
                <label className={labelClass}>
                  {field.field_name}
                  {field.is_required && " *"}
                </label>
                <input
                  type="text"
                  value={val}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  className={inputClass}
                />
              </div>
            );

          case "number":
            return (
              <div key={field.id}>
                <label className={labelClass}>
                  {field.field_name}
                  {field.is_required && " *"}
                </label>
                <input
                  type="number"
                  value={val}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  className={inputClass}
                />
              </div>
            );

          case "date":
            return (
              <div key={field.id}>
                <label className={labelClass}>
                  {field.field_name}
                  {field.is_required && " *"}
                </label>
                <input
                  type="date"
                  value={val}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  className={inputClass}
                />
              </div>
            );

          case "select":
            return (
              <div key={field.id}>
                <label className={labelClass}>
                  {field.field_name}
                  {field.is_required && " *"}
                </label>
                <select
                  value={val}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  className={inputClass}
                >
                  <option value="">Selecione...</option>
                  {(field.field_options ?? []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            );

          case "boolean":
            return (
              <div key={field.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`cf-${field.id}`}
                  checked={val === "true"}
                  onChange={(e) =>
                    handleChange(field.id, e.target.checked ? "true" : "false")
                  }
                  className="h-4 w-4 rounded border-[var(--border-default)] bg-[var(--bg-surface)] accent-orange-500"
                />
                <label
                  htmlFor={`cf-${field.id}`}
                  className="text-sm text-[var(--text-primary)]"
                >
                  {field.field_name}
                  {field.is_required && " *"}
                </label>
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}

/** Helper: save custom field values after entity creation/update */
async function saveCustomFieldValues(
  entityId: string,
  entityType: "deal" | "contact" | "company",
  values: Record<string, string>,
): Promise<boolean> {
  const entries = Object.entries(values).filter(
    ([, v]) => v !== undefined && v !== "",
  );
  if (entries.length === 0) return true;

  try {
    const res = await fetch("/api/custom-field-values", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity_id: entityId,
        entity_type: entityType,
        values: entries.map(([custom_field_id, value]) => ({
          custom_field_id,
          value,
        })),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export { CustomFieldsForm, saveCustomFieldValues };
