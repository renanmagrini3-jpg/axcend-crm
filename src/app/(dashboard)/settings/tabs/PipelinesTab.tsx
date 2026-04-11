"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Button, Card, Modal, useToast } from "@/components/ui";
import { fadeIn, staggerContainer, staggerChild } from "@/lib/motion";

interface Stage {
  id: string;
  name: string;
  order: number;
  pipeline_id: string;
}

interface Pipeline {
  id: string;
  name: string;
  pipeline_stages: Stage[];
}

const inputClass =
  "w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] transition-colors focus:border-[var(--border-focus)] focus:outline-none";
const labelClass = "mb-1 block text-xs font-medium text-[var(--text-secondary)]";

type NameModalMode =
  | { kind: "create-pipeline" }
  | { kind: "rename-pipeline"; pipelineId: string; current: string }
  | { kind: "create-stage"; pipelineId: string }
  | { kind: "rename-stage"; pipelineId: string; stageId: string; current: string }
  | null;

export function PipelinesTab() {
  const { toast } = useToast();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<NameModalMode>(null);
  const [modalName, setModalName] = useState("");
  const [saving, setSaving] = useState(false);
  const [reordering, setReordering] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/pipelines");
      const json = await res.json();
      if (!res.ok) {
        toast(json.error || "Erro ao carregar pipelines", "error");
        return;
      }
      setPipelines(json as Pipeline[]);
    } catch {
      toast("Erro de conexão", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreatePipeline = () => {
    setModal({ kind: "create-pipeline" });
    setModalName("");
  };

  const openRenamePipeline = (p: Pipeline) => {
    setModal({ kind: "rename-pipeline", pipelineId: p.id, current: p.name });
    setModalName(p.name);
  };

  const openCreateStage = (pipelineId: string) => {
    setModal({ kind: "create-stage", pipelineId });
    setModalName("");
  };

  const openRenameStage = (pipelineId: string, stage: Stage) => {
    setModal({
      kind: "rename-stage",
      pipelineId,
      stageId: stage.id,
      current: stage.name,
    });
    setModalName(stage.name);
  };

  const closeModal = () => {
    setModal(null);
    setModalName("");
  };

  const handleModalSave = useCallback(async () => {
    if (!modal) return;
    if (!modalName.trim()) {
      toast("Nome é obrigatório", "warning");
      return;
    }
    setSaving(true);
    try {
      let res: Response;
      if (modal.kind === "create-pipeline") {
        res = await fetch("/api/pipelines", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: modalName.trim() }),
        });
      } else if (modal.kind === "rename-pipeline") {
        res = await fetch(`/api/pipelines/${modal.pipelineId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: modalName.trim() }),
        });
      } else if (modal.kind === "create-stage") {
        res = await fetch(`/api/pipelines/${modal.pipelineId}/stages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: modalName.trim() }),
        });
      } else {
        res = await fetch(
          `/api/pipelines/${modal.pipelineId}/stages/${modal.stageId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: modalName.trim() }),
          },
        );
      }

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(json.error || "Erro ao salvar", "error");
        return;
      }
      toast("Salvo com sucesso", "success");
      closeModal();
      await load();
    } catch {
      toast("Erro de conexão", "error");
    } finally {
      setSaving(false);
    }
  }, [modal, modalName, toast, load]);

  const handleDeletePipeline = useCallback(
    async (pipeline: Pipeline) => {
      if (
        !window.confirm(`Excluir o pipeline "${pipeline.name}"? Esta ação é irreversível.`)
      )
        return;
      try {
        const res = await fetch(`/api/pipelines/${pipeline.id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          toast(json.error || "Erro ao excluir", "error");
          return;
        }
        toast("Pipeline excluído", "success");
        await load();
      } catch {
        toast("Erro de conexão", "error");
      }
    },
    [toast, load],
  );

  const handleDeleteStage = useCallback(
    async (pipelineId: string, stage: Stage) => {
      if (!window.confirm(`Excluir a etapa "${stage.name}"?`)) return;
      try {
        const res = await fetch(
          `/api/pipelines/${pipelineId}/stages/${stage.id}`,
          { method: "DELETE" },
        );
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          toast(json.error || "Erro ao excluir", "error");
          return;
        }
        toast("Etapa excluída", "success");
        await load();
      } catch {
        toast("Erro de conexão", "error");
      }
    },
    [toast, load],
  );

  const handleReorder = useCallback(
    async (pipeline: Pipeline, stageId: string, direction: "up" | "down") => {
      const stages = [...pipeline.pipeline_stages].sort(
        (a, b) => a.order - b.order,
      );
      const idx = stages.findIndex((s) => s.id === stageId);
      if (idx < 0) return;
      const swapWith = direction === "up" ? idx - 1 : idx + 1;
      if (swapWith < 0 || swapWith >= stages.length) return;

      const reordered = [...stages];
      [reordered[idx], reordered[swapWith]] = [reordered[swapWith], reordered[idx]];

      const payload = reordered.map((s, i) => ({ id: s.id, order: i + 1 }));

      setReordering(pipeline.id);
      try {
        const res = await fetch(
          `/api/pipelines/${pipeline.id}/stages/reorder`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ stages: payload }),
          },
        );
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          toast(json.error || "Erro ao reordenar", "error");
          return;
        }
        await load();
      } catch {
        toast("Erro de conexão", "error");
      } finally {
        setReordering(null);
      }
    },
    [toast, load],
  );

  const modalTitle = (() => {
    if (!modal) return "";
    if (modal.kind === "create-pipeline") return "Novo Pipeline";
    if (modal.kind === "rename-pipeline") return "Renomear Pipeline";
    if (modal.kind === "create-stage") return "Nova Etapa";
    return "Renomear Etapa";
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[var(--text-muted)]">
        <Loader2 size={18} className="mr-2 animate-spin" />
        Carregando pipelines…
      </div>
    );
  }

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Pipelines</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Gerencie seus pipelines e etapas de vendas.
          </p>
        </div>
        <Button size="sm" icon={<Plus size={14} />} onClick={openCreatePipeline}>
          Novo Pipeline
        </Button>
      </div>

      {pipelines.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--text-muted)]">
          Nenhum pipeline criado ainda.
        </p>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {pipelines.map((pipeline) => {
            const stages = [...pipeline.pipeline_stages].sort(
              (a, b) => a.order - b.order,
            );
            const isReordering = reordering === pipeline.id;
            return (
              <motion.div key={pipeline.id} variants={staggerChild}>
                <Card hoverable={false} className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                      {pipeline.name}
                    </h3>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openRenamePipeline(pipeline)}
                        className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                        aria-label="Renomear pipeline"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePipeline(pipeline)}
                        className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-red-400"
                        aria-label="Excluir pipeline"
                      >
                        <Trash2 size={14} />
                      </button>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Plus size={14} />}
                        onClick={() => openCreateStage(pipeline.id)}
                      >
                        Nova Etapa
                      </Button>
                    </div>
                  </div>

                  {stages.length === 0 ? (
                    <p className="py-4 text-center text-xs text-[var(--text-muted)]">
                      Nenhuma etapa.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {stages.map((stage, index) => (
                        <div
                          key={stage.id}
                          className="flex items-center gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2.5"
                        >
                          <div className="flex shrink-0 flex-col">
                            <button
                              type="button"
                              disabled={index === 0 || isReordering}
                              onClick={() => handleReorder(pipeline, stage.id, "up")}
                              className="text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] disabled:opacity-30"
                              aria-label="Mover para cima"
                            >
                              <ArrowUp size={12} />
                            </button>
                            <button
                              type="button"
                              disabled={index === stages.length - 1 || isReordering}
                              onClick={() => handleReorder(pipeline, stage.id, "down")}
                              className="text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] disabled:opacity-30"
                              aria-label="Mover para baixo"
                            >
                              <ArrowDown size={12} />
                            </button>
                          </div>
                          <span className="flex-1 text-sm text-[var(--text-primary)]">
                            {stage.name}
                          </span>
                          <span className="text-xs text-[var(--text-muted)]">
                            Etapa {index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => openRenameStage(pipeline.id, stage)}
                            className="rounded-md p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
                            aria-label="Renomear etapa"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteStage(pipeline.id, stage)}
                            className="rounded-md p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-surface)] hover:text-red-400"
                            aria-label="Excluir etapa"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <Modal
        open={modal !== null}
        onClose={closeModal}
        title={modalTitle}
        className="max-w-md"
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Nome</label>
            <input
              autoFocus
              value={modalName}
              onChange={(e) => setModalName(e.target.value)}
              placeholder="Digite o nome"
              className={inputClass}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleModalSave();
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
            <Button size="sm" onClick={handleModalSave} loading={saving}>
              Salvar
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
