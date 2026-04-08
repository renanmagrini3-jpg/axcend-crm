"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  GitBranch,
  Play,
  Clock,
  Plus,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui";
import { staggerContainer, staggerChild } from "@/lib/motion";
import { cn } from "@/lib/cn";

type StepType = "trigger" | "condition" | "action" | "wait";

interface WorkflowStep {
  id: string;
  type: StepType;
  label: string;
  description: string;
  branch?: "yes" | "no";
}

const STEP_CONFIG: Record<
  StepType,
  { icon: typeof Zap; color: string; bg: string; border: string; typeLabel: string }
> = {
  trigger: {
    icon: Zap,
    color: "text-orange-500",
    bg: "bg-orange-500/15",
    border: "border-orange-500/30",
    typeLabel: "Trigger",
  },
  condition: {
    icon: GitBranch,
    color: "text-blue-500",
    bg: "bg-blue-500/15",
    border: "border-blue-500/30",
    typeLabel: "Condição",
  },
  action: {
    icon: Play,
    color: "text-emerald-500",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/30",
    typeLabel: "Ação",
  },
  wait: {
    icon: Clock,
    color: "text-amber-500",
    bg: "bg-amber-500/15",
    border: "border-amber-500/30",
    typeLabel: "Espera",
  },
};

const DEFAULT_WORKFLOW: WorkflowStep[] = [
  {
    id: "1",
    type: "trigger",
    label: "Quando lead novo entra no pipeline",
    description: "Dispara quando um lead é criado e adicionado ao pipeline comercial.",
  },
  {
    id: "2",
    type: "action",
    label: "Criar tarefa de primeiro contato",
    description: "Cria uma tarefa para o vendedor responsável entrar em contato.",
  },
  {
    id: "3",
    type: "wait",
    label: "Aguardar 1 dia",
    description: "Pausa o fluxo por 24 horas antes de continuar.",
  },
  {
    id: "4",
    type: "condition",
    label: "Tarefa foi concluída?",
    description: "Verifica se a tarefa de primeiro contato foi finalizada.",
  },
  {
    id: "5",
    type: "action",
    label: "Enviar e-mail de follow-up",
    description: "Se sim: envia e-mail de acompanhamento ao lead.",
    branch: "yes",
  },
  {
    id: "6",
    type: "action",
    label: "Alertar gestor",
    description: "Se não: notifica o gestor sobre a tarefa pendente.",
    branch: "no",
  },
];

function WorkflowBuilder() {
  const [steps] = useState<WorkflowStep[]>(DEFAULT_WORKFLOW);

  return (
    <div className="py-2">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative flex flex-col items-center"
      >
        {steps.map((step, index) => {
          const config = STEP_CONFIG[step.type];
          const Icon = config.icon;
          const isLast = index === steps.length - 1;
          const isBranch = step.branch === "yes" || step.branch === "no";

          return (
            <motion.div
              key={step.id}
              variants={staggerChild}
              className="flex w-full flex-col items-center"
            >
              {/* Branch label */}
              {isBranch && (
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      step.branch === "yes"
                        ? "bg-emerald-500/15 text-emerald-500"
                        : "bg-red-500/15 text-red-500",
                    )}
                  >
                    {step.branch === "yes" ? "Sim" : "Não"}
                  </span>
                </div>
              )}

              {/* Step card */}
              <div
                className={cn(
                  "group relative flex w-full max-w-md items-start gap-3 rounded-xl border bg-[var(--bg-surface)] p-4 transition-colors hover:bg-[var(--bg-elevated)]",
                  config.border,
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    config.bg,
                  )}
                >
                  <Icon size={18} className={config.color} />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex items-center gap-2">
                    <span className={cn("text-xs font-semibold uppercase tracking-wide", config.color)}>
                      {config.typeLabel}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {step.label}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    {step.description}
                  </p>
                </div>

                {/* Edit indicator */}
                <ChevronRight
                  size={16}
                  className="shrink-0 text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100"
                />
              </div>

              {/* Connector line */}
              {!isLast && (
                <div className="flex flex-col items-center py-1">
                  <div className="h-6 w-px bg-[var(--border-default)]" />
                  <div className="h-1.5 w-1.5 rounded-full bg-[var(--border-default)]" />
                </div>
              )}
            </motion.div>
          );
        })}

        {/* Add step button */}
        <motion.div variants={staggerChild} className="mt-4">
          <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={() => {}}>
            Adicionar Passo
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}

export { WorkflowBuilder };
