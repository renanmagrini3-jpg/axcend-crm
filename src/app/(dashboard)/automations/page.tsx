"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Plus,
  Play,
  Pause,
  Copy,
  Pencil,
  Trash2,
  Clock,
  Activity,
  Mail,
  Bell,
  Target,
} from "lucide-react";
import { PageContainer } from "@/components/layout";
import { Card, Button, Badge, Modal } from "@/components/ui";
import { WorkflowBuilder } from "@/components/data/WorkflowBuilder";
import { staggerContainer, staggerChild } from "@/lib/motion";
import { cn } from "@/lib/cn";

type AutomationStatus = "active" | "inactive";
type FilterTab = "active" | "all" | "inactive";

interface Automation {
  id: string;
  name: string;
  description: string;
  status: AutomationStatus;
  trigger: string;
  executions: number;
  lastExecution: string;
  icon: typeof Zap;
}

const AUTOMATIONS: Automation[] = [
  {
    id: "1",
    name: "Boas-vindas ao Lead",
    description: "Envia e-mail de boas-vindas e cria tarefa de primeiro contato quando um novo lead entra no pipeline.",
    status: "active",
    trigger: "Quando lead entra no pipeline",
    executions: 142,
    lastExecution: "há 2 horas",
    icon: Mail,
  },
  {
    id: "2",
    name: "Follow-up Pós-Reunião",
    description: "Agenda follow-up automático 2 dias após reunião marcada como concluída.",
    status: "active",
    trigger: "Quando reunião é concluída",
    executions: 87,
    lastExecution: "há 5 horas",
    icon: Clock,
  },
  {
    id: "3",
    name: "Alerta Deal Parado",
    description: "Notifica o gestor quando um deal fica mais de 7 dias sem movimentação na mesma etapa.",
    status: "active",
    trigger: "Quando deal fica parado por 7 dias",
    executions: 56,
    lastExecution: "há 1 dia",
    icon: Bell,
  },
  {
    id: "4",
    name: "E-mail Pós-Proposta",
    description: "Envia e-mail de acompanhamento 3 dias após envio de proposta comercial.",
    status: "inactive",
    trigger: "Quando proposta é enviada",
    executions: 23,
    lastExecution: "há 2 semanas",
    icon: Target,
  },
  {
    id: "5",
    name: "Notificação Meta Batida",
    description: "Celebra no canal do time quando um vendedor bate a meta mensal de vendas.",
    status: "active",
    trigger: "Quando meta mensal é atingida",
    executions: 12,
    lastExecution: "há 3 dias",
    icon: Activity,
  },
];

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "active", label: "Ativas" },
  { key: "all", label: "Todas" },
  { key: "inactive", label: "Inativas" },
];

export default function AutomationsPage() {
  const [filter, setFilter] = useState<FilterTab>("all");
  const [automations, setAutomations] = useState(AUTOMATIONS);
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);

  const filtered = filter === "all"
    ? automations
    : automations.filter((a) => a.status === filter);

  const toggleStatus = useCallback((id: string) => {
    setAutomations((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: a.status === "active" ? "inactive" as const : "active" as const }
          : a,
      ),
    );
  }, []);

  const handleEdit = useCallback((automation: Automation) => {
    setSelectedAutomation(automation);
    setWorkflowOpen(true);
  }, []);

  const handleNew = useCallback(() => {
    setSelectedAutomation(null);
    setWorkflowOpen(true);
  }, []);

  return (
    <PageContainer title="Automações" description="Automatize tarefas repetitivas e acelere seu processo comercial.">
      {/* Header actions */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Filter tabs */}
        <div className="flex items-center gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                filter === tab.key
                  ? "bg-orange-500 text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Button icon={<Plus size={16} />} onClick={handleNew}>
          Nova Automação
        </Button>
      </div>

      {/* Automation cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid gap-4"
      >
        <AnimatePresence mode="popLayout">
          {filtered.map((automation) => {
            const Icon = automation.icon;
            return (
              <motion.div
                key={automation.id}
                variants={staggerChild}
                layout
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-4 lg:flex-1">
                    {/* Icon */}
                    <div
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
                        automation.status === "active"
                          ? "bg-orange-500/15 text-orange-500"
                          : "bg-neutral-500/15 text-[var(--text-muted)]",
                      )}
                    >
                      <Icon size={20} />
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                          {automation.name}
                        </h3>
                        <Badge
                          variant={automation.status === "active" ? "success" : "default"}
                          size="sm"
                        >
                          {automation.status === "active" ? "Ativa" : "Inativa"}
                        </Badge>
                      </div>
                      <p className="mb-2 text-sm text-[var(--text-secondary)] line-clamp-1">
                        {automation.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                        <span className="flex items-center gap-1">
                          <Zap size={12} />
                          {automation.trigger}
                        </span>
                        <span className="flex items-center gap-1">
                          <Play size={12} />
                          {automation.executions} execuções
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {automation.lastExecution}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 lg:shrink-0">
                    {/* Toggle */}
                    <button
                      onClick={() => toggleStatus(automation.id)}
                      className={cn(
                        "relative h-6 w-11 rounded-full transition-colors",
                        automation.status === "active" ? "bg-emerald-500" : "bg-neutral-600",
                      )}
                      aria-label={automation.status === "active" ? "Desativar" : "Ativar"}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                          automation.status === "active" && "translate-x-5",
                        )}
                      />
                    </button>

                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Pencil size={14} />}
                      onClick={() => handleEdit(automation)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Copy size={14} />}
                      onClick={() => {}}
                    >
                      Duplicar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={<Trash2 size={14} />}
                      onClick={() =>
                        setAutomations((prev) => prev.filter((a) => a.id !== automation.id))
                      }
                    >
                      Excluir
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {filtered.length === 0 && (
        <div className="mt-12 flex flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/10">
            <Zap size={28} className="text-orange-500" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Nenhuma automação {filter === "active" ? "ativa" : filter === "inactive" ? "inativa" : ""}
          </h3>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Crie sua primeira automação para acelerar seu processo comercial.
          </p>
        </div>
      )}

      {/* Workflow Builder Modal */}
      <Modal
        open={workflowOpen}
        onClose={() => setWorkflowOpen(false)}
        title={selectedAutomation ? `Editar: ${selectedAutomation.name}` : "Nova Automação"}
        className="max-w-3xl"
      >
        <WorkflowBuilder />
      </Modal>
    </PageContainer>
  );
}
