"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Rocket,
  Building2,
  GitBranch,
  Users,
  Upload,
  Check,
  ChevronRight,
  SkipForward,
} from "lucide-react";
import { PageContainer } from "@/components/layout";
import { Card, Button, Badge } from "@/components/ui";
import { staggerContainer, staggerChild, fadeInUp } from "@/lib/motion";
import { cn } from "@/lib/cn";

interface SetupStep {
  id: number;
  title: string;
  description: string;
  icon: typeof Building2;
}

const STEPS: SetupStep[] = [
  {
    id: 1,
    title: "Configure sua empresa",
    description: "Defina o nome, logo e modo de operação (B2B ou B2C) da sua empresa.",
    icon: Building2,
  },
  {
    id: 2,
    title: "Crie seu primeiro pipeline",
    description: "Defina as etapas do seu funil de vendas para organizar seus negócios.",
    icon: GitBranch,
  },
  {
    id: 3,
    title: "Convide sua equipe",
    description: "Adicione vendedores e defina permissões para colaborar.",
    icon: Users,
  },
  {
    id: 4,
    title: "Importe seus contatos",
    description: "Faça upload de um arquivo CSV para importar sua base de contatos.",
    icon: Upload,
  },
];

export default function OnboardingPage() {
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  function toggleStep(id: number) {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const completedCount = completed.size;
  const progress = (completedCount / STEPS.length) * 100;

  return (
    <PageContainer title="" description="">
      <div className="mx-auto max-w-2xl py-8">
        {/* Hero */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="mb-8 text-center"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/15">
            <Rocket size={32} className="text-orange-500" />
          </div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">
            Bem-vindo à Axcend CRM!
          </h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            Complete os passos abaixo para configurar sua conta e começar a vender.
          </p>
        </motion.div>

        {/* Progress bar */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[var(--text-secondary)]">
              Progresso do setup
            </span>
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              {completedCount} de {STEPS.length} concluídos
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-elevated)]">
            <motion.div
              className="h-full rounded-full bg-orange-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
            />
          </div>
        </motion.div>

        {/* Steps */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isDone = completed.has(step.id);

            return (
              <motion.div key={step.id} variants={staggerChild}>
                <Card
                  hoverable={false}
                  className={cn(
                    "flex items-start gap-4 transition-colors",
                    isDone && "border-emerald-500/30 bg-emerald-500/5",
                  )}
                >
                  {/* Step number */}
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-colors",
                      isDone
                        ? "bg-emerald-500/15 text-emerald-500"
                        : "bg-orange-500/15 text-orange-500",
                    )}
                  >
                    {isDone ? <Check size={18} /> : step.id}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                        {step.title}
                      </h3>
                      <Badge
                        variant={isDone ? "success" : "default"}
                        size="sm"
                      >
                        {isDone ? "Concluído" : "Pendente"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {step.description}
                    </p>
                  </div>

                  {/* Action */}
                  <Button
                    variant={isDone ? "secondary" : "primary"}
                    size="sm"
                    icon={isDone ? <Check size={14} /> : <ChevronRight size={14} />}
                    onClick={() => toggleStep(step.id)}
                    className="shrink-0"
                  >
                    {isDone ? "Feito" : "Configurar"}
                  </Button>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Skip */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="mt-8 text-center"
        >
          <Button
            variant="secondary"
            icon={<SkipForward size={16} />}
          >
            Pular setup
          </Button>
        </motion.div>
      </div>
    </PageContainer>
  );
}
