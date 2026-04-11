"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Loader2,
  Plus,
  Rocket,
  SkipForward,
  Trash2,
  Users,
} from "lucide-react";
import { Button, useToast } from "@/components/ui";
import { createBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";

interface Organization {
  id: string;
  name: string;
  slug: string;
  mode: "B2B" | "B2C";
}

interface PipelineStage {
  id: string;
  name: string;
  order: number;
  pipeline_id: string;
}

interface Pipeline {
  id: string;
  name: string;
  pipeline_stages: PipelineStage[];
}

interface StageDraft {
  id?: string;
  tempId: string;
  name: string;
}

const DEFAULT_STAGE_NAMES = [
  "Prospecção",
  "Agendamento",
  "Reunião",
  "Proposta",
  "Negociação",
  "Fechado Ganho",
  "Fechado Perdido",
];

const STEPS = [
  { id: 1, label: "Empresa", icon: Building2 },
  { id: 2, label: "Pipeline", icon: GitBranch },
  { id: 3, label: "Equipe", icon: Users },
  { id: 4, label: "Concluir", icon: Check },
] as const;

const stepSlide = {
  enter: (direction: number) => ({ x: direction > 0 ? 60 : -60, opacity: 0 }),
  center: {
    x: 0,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -60 : 60,
    opacity: 0,
    transition: { duration: 0.2 },
  }),
};

const inputClass =
  "w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] transition-colors focus:border-[var(--border-focus)] focus:outline-none";
const labelClass = "mb-1 block text-xs font-medium text-[var(--text-secondary)]";

function newTempId() {
  return `new-${Math.random().toString(36).slice(2, 10)}`;
}

export default function OnboardingPage() {
  const { toast } = useToast();
  const supabase = createBrowserClient();

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Existing data (from server)
  const [existingOrg, setExistingOrg] = useState<Organization | null>(null);
  const [existingPipeline, setExistingPipeline] = useState<Pipeline | null>(null);

  // Step 1 form
  const [orgName, setOrgName] = useState("");
  const [mode, setMode] = useState<"B2B" | "B2C">("B2B");

  // Step 2 form
  const [pipelineName, setPipelineName] = useState("Pipeline Comercial");
  const [stages, setStages] = useState<StageDraft[]>([]);

  // Step 3 form
  const [invites, setInvites] = useState<string[]>([""]);

  const loadInitial = useCallback(async () => {
    let loadedStages: StageDraft[] = [];
    try {
      const orgRes = await fetch("/api/organizations/current");
      if (orgRes.ok) {
        const org = (await orgRes.json()) as Organization;
        setExistingOrg(org);
        setOrgName(org.name);
        setMode(org.mode);

        const pipeRes = await fetch("/api/pipelines");
        if (pipeRes.ok) {
          const pipelines = (await pipeRes.json()) as Pipeline[];
          if (pipelines.length > 0) {
            const first = pipelines[0];
            setExistingPipeline(first);
            setPipelineName(first.name);
            loadedStages = [...first.pipeline_stages]
              .sort((a, b) => a.order - b.order)
              .map((s) => ({ id: s.id, tempId: s.id, name: s.name }));
          }
        }
      }
    } catch {
      /* ignore — user without org falls through */
    }

    if (loadedStages.length === 0) {
      loadedStages = DEFAULT_STAGE_NAMES.map((name) => ({
        tempId: newTempId(),
        name,
      }));
    }
    setStages(loadedStages);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // --- Step 2 stage editors ---

  const updateStageName = (tempId: string, value: string) => {
    setStages((prev) =>
      prev.map((s) => (s.tempId === tempId ? { ...s, name: value } : s)),
    );
  };

  const addStage = () => {
    setStages((prev) => [...prev, { tempId: newTempId(), name: "" }]);
  };

  const removeStage = (tempId: string) => {
    setStages((prev) => prev.filter((s) => s.tempId !== tempId));
  };

  const moveStage = (tempId: string, dir: "up" | "down") => {
    setStages((prev) => {
      const idx = prev.findIndex((s) => s.tempId === tempId);
      if (idx < 0) return prev;
      const swap = dir === "up" ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[swap]] = [copy[swap], copy[idx]];
      return copy;
    });
  };

  // --- Step 3 invite editors ---

  const updateInvite = (idx: number, value: string) => {
    setInvites((prev) => prev.map((e, i) => (i === idx ? value : e)));
  };

  const addInviteRow = () => {
    setInvites((prev) => [...prev, ""]);
  };

  const removeInviteRow = (idx: number) => {
    setInvites((prev) => prev.filter((_, i) => i !== idx));
  };

  // --- Navigation ---

  const goNext = () => {
    setDirection(1);
    setStep((s) => Math.min(4, s + 1));
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(1, s - 1));
  };

  // --- Step 1 save ---

  const handleStep1Save = useCallback(async () => {
    if (!orgName.trim()) {
      toast("Nome da empresa é obrigatório", "warning");
      return;
    }
    setSaving(true);
    try {
      let res: Response;
      if (existingOrg) {
        res = await fetch("/api/organizations/current", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: orgName.trim(), mode }),
        });
      } else {
        res = await fetch("/api/organizations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: orgName.trim(), mode }),
        });
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(json.error || "Erro ao salvar empresa", "error");
        return;
      }

      // Re-fetch org + pipeline to sync state (POST may have created default pipeline)
      const orgRes = await fetch("/api/organizations/current");
      if (orgRes.ok) {
        setExistingOrg((await orgRes.json()) as Organization);
      }
      const pipeRes = await fetch("/api/pipelines");
      if (pipeRes.ok) {
        const pipelines = (await pipeRes.json()) as Pipeline[];
        if (pipelines.length > 0) {
          const first = pipelines[0];
          setExistingPipeline(first);
          setPipelineName(first.name);
          setStages(
            [...first.pipeline_stages]
              .sort((a, b) => a.order - b.order)
              .map((s) => ({ id: s.id, tempId: s.id, name: s.name })),
          );
        }
      }

      toast("Empresa configurada", "success");
      goNext();
    } catch {
      toast("Erro de conexão", "error");
    } finally {
      setSaving(false);
    }
  }, [orgName, mode, existingOrg, toast]);

  // --- Step 2 save (pipeline + stages diff) ---

  const handleStep2Save = useCallback(async () => {
    if (!pipelineName.trim()) {
      toast("Nome do pipeline é obrigatório", "warning");
      return;
    }
    if (stages.length < 3) {
      toast("Defina ao menos 3 etapas", "warning");
      return;
    }
    if (stages.some((s) => !s.name.trim())) {
      toast("Todas as etapas precisam de nome", "warning");
      return;
    }
    if (!existingPipeline) {
      toast("Pipeline não encontrado. Volte e salve a empresa primeiro.", "error");
      return;
    }

    setSaving(true);
    try {
      const pipelineId = existingPipeline.id;
      const originalStages = existingPipeline.pipeline_stages;

      if (pipelineName.trim() !== existingPipeline.name) {
        const res = await fetch(`/api/pipelines/${pipelineId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: pipelineName.trim() }),
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          toast(json.error || "Erro ao renomear pipeline", "error");
          return;
        }
      }

      // Delete removed stages
      const keptIds = new Set(
        stages.filter((s) => s.id).map((s) => s.id as string),
      );
      for (const o of originalStages) {
        if (!keptIds.has(o.id)) {
          const res = await fetch(
            `/api/pipelines/${pipelineId}/stages/${o.id}`,
            { method: "DELETE" },
          );
          if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            toast(json.error || `Erro ao remover "${o.name}"`, "error");
            return;
          }
        }
      }

      // Rename kept stages
      for (const n of stages) {
        if (n.id) {
          const original = originalStages.find((o) => o.id === n.id);
          if (original && original.name !== n.name.trim()) {
            const res = await fetch(
              `/api/pipelines/${pipelineId}/stages/${n.id}`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: n.name.trim() }),
              },
            );
            if (!res.ok) {
              const json = await res.json().catch(() => ({}));
              toast(json.error || `Erro ao renomear "${n.name}"`, "error");
              return;
            }
          }
        }
      }

      // Create new stages
      const createdMap = new Map<string, string>();
      for (const n of stages) {
        if (!n.id) {
          const res = await fetch(`/api/pipelines/${pipelineId}/stages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: n.name.trim() }),
          });
          if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            toast(json.error || `Erro ao criar "${n.name}"`, "error");
            return;
          }
          const created = (await res.json()) as { id: string };
          createdMap.set(n.tempId, created.id);
        }
      }

      // Reorder final list
      const reorderPayload = stages.map((s, i) => ({
        id: (s.id ?? createdMap.get(s.tempId)) as string,
        order: i + 1,
      }));
      const reorderRes = await fetch(
        `/api/pipelines/${pipelineId}/stages/reorder`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stages: reorderPayload }),
        },
      );
      if (!reorderRes.ok) {
        const json = await reorderRes.json().catch(() => ({}));
        toast(json.error || "Erro ao reordenar etapas", "error");
        return;
      }

      // Reload pipeline
      const pipeRes = await fetch("/api/pipelines");
      if (pipeRes.ok) {
        const pipelines = (await pipeRes.json()) as Pipeline[];
        const refreshed =
          pipelines.find((p) => p.id === pipelineId) ?? pipelines[0];
        if (refreshed) {
          setExistingPipeline(refreshed);
          setStages(
            [...refreshed.pipeline_stages]
              .sort((a, b) => a.order - b.order)
              .map((s) => ({ id: s.id, tempId: s.id, name: s.name })),
          );
        }
      }

      toast("Pipeline configurado", "success");
      goNext();
    } catch {
      toast("Erro de conexão", "error");
    } finally {
      setSaving(false);
    }
  }, [pipelineName, stages, existingPipeline, toast]);

  // --- Step 3 save (invites) ---

  const handleStep3Save = useCallback(async () => {
    const valid = invites
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0 && e.includes("@"));

    if (valid.length === 0) {
      goNext();
      return;
    }

    setSaving(true);
    let created = 0;
    let failed = 0;
    for (const email of valid) {
      const name = email.split("@")[0] || email;
      try {
        const res = await fetch("/api/team", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, role: "seller" }),
        });
        if (res.ok) {
          created++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }
    setSaving(false);

    if (failed > 0 && created > 0) {
      toast(`${created} convidados, ${failed} falharam`, "warning");
    } else if (failed > 0) {
      toast(`Falha ao convidar ${failed} membros`, "error");
      return;
    } else {
      toast(`${created} ${created === 1 ? "membro convidado" : "membros convidados"}`, "success");
    }
    goNext();
  }, [invites, toast]);

  // --- Step 4 complete ---

  const handleComplete = useCallback(async () => {
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { onboarding_completed: true },
      });
      if (error) {
        toast(error.message, "error");
        setSaving(false);
        return;
      }
      window.location.href = "/dashboard";
    } catch {
      toast("Erro ao concluir", "error");
      setSaving(false);
    }
  }, [supabase, toast]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
        <Loader2 size={18} className="animate-spin" />
        Carregando…
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl px-4 py-8"
    >
      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-8 shadow-lg">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/15">
            <Rocket size={26} className="text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Configure sua conta
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Quatro passos rápidos para começar a usar o Axcend.
          </p>
        </div>

        {/* Step indicator */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = step > s.id;
            const current = step === s.id;
            return (
              <div key={s.id} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                    done
                      ? "bg-emerald-500/15 text-emerald-500"
                      : current
                        ? "bg-orange-500 text-white"
                        : "bg-[var(--bg-elevated)] text-[var(--text-muted)]",
                  )}
                >
                  {done ? <Check size={14} /> : <Icon size={14} />}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "h-px w-6 transition-colors",
                      step > s.id ? "bg-emerald-500" : "bg-[var(--border-default)]",
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Content */}
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={stepSlide}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-5"
              >
                <div>
                  <label className={labelClass}>Nome da empresa</label>
                  <input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Ex: Axcend Sales"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Modo de operação</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(["B2B", "B2C"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMode(m)}
                        className={cn(
                          "rounded-lg border p-3 text-left transition-colors",
                          mode === m
                            ? "border-orange-500 bg-orange-500/10"
                            : "border-[var(--border-default)] bg-[var(--bg-elevated)] hover:border-[var(--text-muted)]",
                        )}
                      >
                        <span
                          className={cn(
                            "text-sm font-semibold",
                            mode === m
                              ? "text-orange-500"
                              : "text-[var(--text-primary)]",
                          )}
                        >
                          {m}
                        </span>
                        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                          {m === "B2B"
                            ? "Vendas para empresas"
                            : "Vendas para consumidores"}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    size="md"
                    icon={<ChevronRight size={16} />}
                    onClick={handleStep1Save}
                    loading={saving}
                  >
                    Salvar e continuar
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={stepSlide}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-5"
              >
                <div>
                  <label className={labelClass}>Nome do pipeline</label>
                  <input
                    value={pipelineName}
                    onChange={(e) => setPipelineName(e.target.value)}
                    placeholder="Ex: Pipeline Comercial"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    Etapas do funil (mínimo 3)
                  </label>
                  <div className="space-y-2">
                    {stages.map((stage, index) => (
                      <div
                        key={stage.tempId}
                        className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-2 py-1.5"
                      >
                        <div className="flex shrink-0 flex-col">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveStage(stage.tempId, "up")}
                            className="text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] disabled:opacity-30"
                            aria-label="Mover para cima"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            type="button"
                            disabled={index === stages.length - 1}
                            onClick={() => moveStage(stage.tempId, "down")}
                            className="text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] disabled:opacity-30"
                            aria-label="Mover para baixo"
                          >
                            <ArrowDown size={12} />
                          </button>
                        </div>
                        <span className="w-5 shrink-0 text-center text-xs text-[var(--text-muted)]">
                          {index + 1}
                        </span>
                        <input
                          value={stage.name}
                          onChange={(e) =>
                            updateStageName(stage.tempId, e.target.value)
                          }
                          placeholder="Nome da etapa"
                          className="flex-1 bg-transparent text-sm text-[var(--text-primary)] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => removeStage(stage.tempId)}
                          className="rounded-md p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-surface)] hover:text-red-400"
                          aria-label="Remover etapa"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addStage}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-orange-500 transition-colors hover:text-orange-400"
                  >
                    <Plus size={12} />
                    Adicionar etapa
                  </button>
                </div>
                <div className="flex justify-between gap-2 pt-2">
                  <Button
                    variant="secondary"
                    size="md"
                    icon={<ChevronLeft size={16} />}
                    onClick={goBack}
                    disabled={saving}
                  >
                    Voltar
                  </Button>
                  <Button
                    size="md"
                    icon={<ChevronRight size={16} />}
                    onClick={handleStep2Save}
                    loading={saving}
                  >
                    Salvar e continuar
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                custom={direction}
                variants={stepSlide}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-5"
              >
                <div>
                  <label className={labelClass}>
                    Emails dos membros (opcional)
                  </label>
                  <p className="mb-2 text-xs text-[var(--text-muted)]">
                    Membros ficarão como <strong>Pendente</strong> até se cadastrarem com esse email.
                  </p>
                  <div className="space-y-2">
                    {invites.map((email, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => updateInvite(idx, e.target.value)}
                          placeholder="email@empresa.com"
                          className={inputClass}
                        />
                        {invites.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeInviteRow(idx)}
                            className="shrink-0 rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-red-400"
                            aria-label="Remover linha"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addInviteRow}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-orange-500 transition-colors hover:text-orange-400"
                  >
                    <Plus size={12} />
                    Adicionar email
                  </button>
                </div>
                <div className="flex justify-between gap-2 pt-2">
                  <Button
                    variant="secondary"
                    size="md"
                    icon={<ChevronLeft size={16} />}
                    onClick={goBack}
                    disabled={saving}
                  >
                    Voltar
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="md"
                      icon={<SkipForward size={16} />}
                      onClick={goNext}
                      disabled={saving}
                    >
                      Pular
                    </Button>
                    <Button
                      size="md"
                      icon={<ChevronRight size={16} />}
                      onClick={handleStep3Save}
                      loading={saving}
                    >
                      Convidar e continuar
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                custom={direction}
                variants={stepSlide}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-5"
              >
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
                      <Check size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                        Tudo pronto!
                      </h3>
                      <p className="text-xs text-[var(--text-muted)]">
                        Sua conta está configurada.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] p-3">
                    <Building2 size={16} className="mt-0.5 text-orange-500" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-[var(--text-secondary)]">
                        Empresa
                      </p>
                      <p className="truncate text-sm text-[var(--text-primary)]">
                        {existingOrg?.name ?? orgName} · {mode}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] p-3">
                    <GitBranch size={16} className="mt-0.5 text-orange-500" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-[var(--text-secondary)]">
                        Pipeline
                      </p>
                      <p className="truncate text-sm text-[var(--text-primary)]">
                        {pipelineName} · {stages.length} etapas
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] p-3">
                    <Users size={16} className="mt-0.5 text-orange-500" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-[var(--text-secondary)]">
                        Equipe
                      </p>
                      <p className="truncate text-sm text-[var(--text-primary)]">
                        {invites.filter((e) => e.trim() && e.includes("@")).length}{" "}
                        {invites.filter((e) => e.trim() && e.includes("@")).length === 1
                          ? "convite enviado"
                          : "convites enviados"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between gap-2 pt-2">
                  <Button
                    variant="secondary"
                    size="md"
                    icon={<ChevronLeft size={16} />}
                    onClick={goBack}
                    disabled={saving}
                  >
                    Voltar
                  </Button>
                  <Button
                    size="md"
                    icon={<Rocket size={16} />}
                    onClick={handleComplete}
                    loading={saving}
                  >
                    Começar a usar
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
