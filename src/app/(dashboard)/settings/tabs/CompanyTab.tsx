"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, Upload } from "lucide-react";
import { Button, Input, useToast } from "@/components/ui";
import { fadeIn } from "@/lib/motion";
import { cn } from "@/lib/cn";

interface Organization {
  id: string;
  name: string;
  slug: string;
  mode: "B2B" | "B2C";
  logo: string | null;
}

export function CompanyTab() {
  const { toast } = useToast();
  const [org, setOrg] = useState<Organization | null>(null);
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"B2B" | "B2C">("B2B");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/organizations/current");
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          toast(json.error || "Erro ao carregar organização", "error");
          return;
        }
        setOrg(json as Organization);
        setName(json.name);
        setMode((json.mode as "B2B" | "B2C") ?? "B2B");
      } catch {
        if (!cancelled) toast("Erro de conexão", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      toast("Nome é obrigatório", "warning");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/organizations/current", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), mode }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast(json.error || "Erro ao salvar", "error");
        return;
      }
      setOrg(json as Organization);
      toast("Organização atualizada", "success");
    } catch {
      toast("Erro de conexão", "error");
    } finally {
      setSaving(false);
    }
  }, [name, mode, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[var(--text-muted)]">
        <Loader2 size={18} className="mr-2 animate-spin" />
        Carregando…
      </div>
    );
  }

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Perfil da Empresa</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Informações gerais da sua organização.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Input
          label="Nome da Empresa"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input label="Slug da URL" value={org?.slug ?? ""} readOnly disabled />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
          Logo da Empresa
        </label>
        <div className="flex h-32 w-32 items-center justify-center rounded-xl border-2 border-dashed border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-muted)]">
          <div className="flex flex-col items-center gap-1">
            <Upload size={20} />
            <span className="text-xs">Em breve</span>
          </div>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
          Modo de Operação
        </label>
        <div className="flex w-fit items-center gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-1">
          {(["B2B", "B2C"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "rounded-md px-5 py-1.5 text-sm font-medium transition-colors",
                mode === m
                  ? "bg-orange-500 text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2">
        <Button icon={<Check size={16} />} onClick={handleSave} loading={saving}>
          Salvar Alterações
        </Button>
      </div>
    </motion.div>
  );
}
