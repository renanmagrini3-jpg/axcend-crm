"use client";

import { motion } from "framer-motion";
import {
  MessageCircle,
  Mail,
  Calendar,
  MonitorSmartphone,
  Megaphone,
  BarChart3,
  Workflow,
  Banknote,
  Lock,
} from "lucide-react";
import { Card, Badge } from "@/components/ui";
import { fadeIn, staggerContainer, staggerChild } from "@/lib/motion";
import { cn } from "@/lib/cn";

interface Integration {
  id: string;
  name: string;
  icon: typeof MessageCircle;
  status: "coming_soon" | "connected" | "disconnected";
  description: string;
}

const INTEGRATIONS: Integration[] = [
  {
    id: "1",
    name: "WhatsApp",
    icon: MessageCircle,
    status: "coming_soon",
    description: "Envie mensagens e acompanhe conversas diretamente pelo CRM.",
  },
  {
    id: "2",
    name: "Gmail / E-mail",
    icon: Mail,
    status: "coming_soon",
    description: "Sincronize e-mails automaticamente com seus contatos.",
  },
  {
    id: "3",
    name: "Google Calendar",
    icon: Calendar,
    status: "coming_soon",
    description: "Sincronize reuniões, eventos e tarefas do calendário.",
  },
  {
    id: "4",
    name: "Microsoft Teams",
    icon: MonitorSmartphone,
    status: "coming_soon",
    description: "Receba notificações e faça chamadas de vídeo.",
  },
  {
    id: "5",
    name: "Meta Ads",
    icon: Megaphone,
    status: "coming_soon",
    description: "Importe leads automaticamente do Facebook e Instagram Ads.",
  },
  {
    id: "6",
    name: "Google Ads",
    icon: BarChart3,
    status: "coming_soon",
    description: "Importe leads de campanhas do Google Ads.",
  },
  {
    id: "7",
    name: "Zapier",
    icon: Workflow,
    status: "coming_soon",
    description: "Conecte com +5.000 aplicativos via automações.",
  },
  {
    id: "8",
    name: "Stripe",
    icon: Banknote,
    status: "coming_soon",
    description: "Gerencie pagamentos e assinaturas dos seus clientes.",
  },
];

const STATUS_CONFIG = {
  coming_soon: { label: "Disponível em breve", variant: "default" as const },
  connected: { label: "Conectado", variant: "success" as const },
  disconnected: { label: "Desconectado", variant: "default" as const },
};

export function IntegrationsTab() {
  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Integrações</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Conecte suas ferramentas favoritas ao CRM para automatizar processos.
        </p>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        {INTEGRATIONS.map((integration) => {
          const Icon = integration.icon;
          const statusCfg = STATUS_CONFIG[integration.status];
          const isComingSoon = integration.status === "coming_soon";

          return (
            <motion.div key={integration.id} variants={staggerChild}>
              <Card className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      isComingSoon
                        ? "bg-neutral-500/15 text-[var(--text-muted)]"
                        : "bg-orange-500/15 text-orange-500",
                    )}
                  >
                    <Icon size={20} />
                  </div>
                  <Badge variant={statusCfg.variant} size="sm">
                    {statusCfg.label}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    {integration.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    {integration.description}
                  </p>
                </div>

                <div className="mt-auto">
                  <button
                    disabled
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm font-medium text-[var(--text-muted)] opacity-60 cursor-not-allowed"
                    title="Em breve"
                  >
                    <Lock size={14} />
                    Em breve
                  </button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
