"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Edit3,
  ArrowRightLeft,
  ListPlus,
  StickyNote,
  Phone,
  Mail,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { overlay } from "@/lib/motion";
import { Badge, Avatar, Button } from "@/components/ui";
import type { DealCardData } from "./DealCard";
import type { Priority } from "@/types";

interface DealDetailPanelProps {
  deal: DealCardData | null;
  stageName?: string;
  onClose: () => void;
}

const priorityVariant: Record<Priority, "danger" | "warning" | "info"> = {
  HIGH: "danger",
  MEDIUM: "warning",
  LOW: "info",
};

const priorityLabel: Record<Priority, string> = {
  HIGH: "Alta",
  MEDIUM: "Média",
  LOW: "Baixa",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

const panelVariants = {
  hidden: { x: "100%", opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 30 },
  },
  exit: {
    x: "100%",
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

const fakeActivities = [
  {
    id: "1",
    type: "CALL" as const,
    icon: Phone,
    content: "Ligação de qualificação realizada com sucesso",
    user: "Ana Silva",
    time: "há 2 horas",
  },
  {
    id: "2",
    type: "EMAIL" as const,
    icon: Mail,
    content: "Proposta comercial enviada por e-mail",
    user: "Ana Silva",
    time: "há 1 dia",
  },
  {
    id: "3",
    type: "MEETING" as const,
    icon: Calendar,
    content: "Reunião de apresentação agendada",
    user: "Carlos Souza",
    time: "há 3 dias",
  },
];

function DealDetailPanel({ deal, stageName, onClose }: DealDetailPanelProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (deal) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [deal, handleKeyDown]);

  return (
    <AnimatePresence>
      {deal && (
        <>
          <motion.div
            variants={overlay}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 bg-[var(--bg-overlay)]"
            onClick={onClose}
          />

          <motion.aside
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed right-0 top-0 z-50 flex h-dvh w-full max-w-md flex-col border-l border-[var(--border-default)] bg-[var(--bg-surface)] shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-default)] px-6 py-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] line-clamp-1">
                {deal.title}
              </h2>
              <button
                onClick={onClose}
                className="rounded-md p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* Value & Priority */}
              <div className="mb-6 flex items-center justify-between">
                <p className="text-3xl font-bold text-[var(--text-primary)]">
                  {formatCurrency(deal.value)}
                </p>
                <Badge variant={priorityVariant[deal.priority]}>
                  {priorityLabel[deal.priority]}
                </Badge>
              </div>

              {/* Info grid */}
              <div className="mb-6 grid grid-cols-2 gap-4">
                <InfoItem label="Contato" value={deal.contactName} />
                <InfoItem
                  label="Empresa"
                  value={deal.companyName ?? "—"}
                />
                <InfoItem label="Etapa" value={stageName ?? "—"} />
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-1">
                    Responsável
                  </p>
                  <div className="flex items-center gap-2">
                    <Avatar name={deal.assigneeName} size="sm" />
                    <span className="text-sm text-[var(--text-primary)]">
                      {deal.assigneeName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mb-6 flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" icon={<Edit3 size={14} />}>
                  Editar
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<ArrowRightLeft size={14} />}
                >
                  Mover Etapa
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<ListPlus size={14} />}
                >
                  Adicionar Tarefa
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<StickyNote size={14} />}
                >
                  Adicionar Nota
                </Button>
              </div>

              {/* Custom fields placeholder */}
              <div className="mb-6">
                <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
                  Campos Customizados
                </h3>
                <div className="rounded-lg border border-dashed border-[var(--border-default)] p-4 text-center text-sm text-[var(--text-muted)]">
                  Nenhum campo customizado configurado
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
                  Atividades Recentes
                </h3>
                <div className="flex flex-col gap-3">
                  {fakeActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] p-3"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                        <activity.icon size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-[var(--text-primary)]">
                          {activity.content}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                          {activity.user} · {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[var(--text-muted)] mb-1">{label}</p>
      <p className="text-sm font-medium text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

export { DealDetailPanel };
