"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  GitBranch,
  Columns3,
  Users,
  ListTodo,
  ThumbsDown,
  Puzzle,
  Bell,
  CreditCard,
  BookOpen,
  GripVertical,
  Plus,
  Upload,
  Check,
  ExternalLink,
  MessageCircle,
  Mail,
  Calendar,
  MonitorSmartphone,
  Megaphone,
  BarChart3,
  Workflow,
  Banknote,
} from "lucide-react";
import { PageContainer } from "@/components/layout";
import { Card, Button, Badge, Input } from "@/components/ui";
import { fadeIn, staggerContainer, staggerChild } from "@/lib/motion";
import { cn } from "@/lib/cn";

type SettingsTab =
  | "company"
  | "pipelines"
  | "custom-fields"
  | "teams"
  | "task-types"
  | "loss-reasons"
  | "integrations"
  | "notifications"
  | "subscription"
  | "playbooks";

interface TabItem {
  key: SettingsTab;
  label: string;
  icon: typeof Building2;
}

const TABS: TabItem[] = [
  { key: "company", label: "Perfil da Empresa", icon: Building2 },
  { key: "pipelines", label: "Pipelines", icon: GitBranch },
  { key: "custom-fields", label: "Campos Customizados", icon: Columns3 },
  { key: "teams", label: "Equipes", icon: Users },
  { key: "task-types", label: "Tipos de Tarefa", icon: ListTodo },
  { key: "loss-reasons", label: "Motivos de Perda", icon: ThumbsDown },
  { key: "integrations", label: "Integrações", icon: Puzzle },
  { key: "notifications", label: "Notificações", icon: Bell },
  { key: "subscription", label: "Assinatura", icon: CreditCard },
  { key: "playbooks", label: "Playbooks", icon: BookOpen },
];

// --- Company Profile Tab ---

function CompanyTab() {
  const [companyName, setCompanyName] = useState("Axcend Sales");
  const [slug, setSlug] = useState("axcend-sales");
  const [mode, setMode] = useState<"B2B" | "B2C">("B2B");

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
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
        />
        <Input
          label="Slug da URL"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
      </div>

      {/* Logo upload */}
      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
          Logo da Empresa
        </label>
        <div className="flex h-32 w-32 items-center justify-center rounded-xl border-2 border-dashed border-[var(--border-default)] bg-[var(--bg-elevated)] transition-colors hover:border-orange-500/50">
          <div className="flex flex-col items-center gap-1 text-[var(--text-muted)]">
            <Upload size={20} />
            <span className="text-xs">Upload</span>
          </div>
        </div>
      </div>

      {/* B2B / B2C Toggle */}
      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
          Modo de Operação
        </label>
        <div className="flex items-center gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-1 w-fit">
          {(["B2B", "B2C"] as const).map((m) => (
            <button
              key={m}
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
        <Button icon={<Check size={16} />}>Salvar Alterações</Button>
      </div>
    </motion.div>
  );
}

// --- Pipelines Tab ---

interface PipelineStage {
  id: string;
  name: string;
  color: string;
}

interface Pipeline {
  id: string;
  name: string;
  stages: PipelineStage[];
}

const MOCK_PIPELINES: Pipeline[] = [
  {
    id: "1",
    name: "Pipeline Comercial",
    stages: [
      { id: "s1", name: "Qualificação", color: "bg-blue-500" },
      { id: "s2", name: "Reunião Agendada", color: "bg-indigo-500" },
      { id: "s3", name: "Proposta Enviada", color: "bg-purple-500" },
      { id: "s4", name: "Negociação", color: "bg-amber-500" },
      { id: "s5", name: "Fechamento", color: "bg-emerald-500" },
    ],
  },
  {
    id: "2",
    name: "Pipeline Seguros",
    stages: [
      { id: "s6", name: "Lead Recebido", color: "bg-blue-500" },
      { id: "s7", name: "Cotação", color: "bg-indigo-500" },
      { id: "s8", name: "Análise de Risco", color: "bg-amber-500" },
      { id: "s9", name: "Aprovação", color: "bg-emerald-500" },
    ],
  },
];

function PipelinesTab() {
  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Pipelines</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Gerencie seus pipelines e etapas de vendas.
          </p>
        </div>
        <Button size="sm" icon={<Plus size={14} />}>
          Novo Pipeline
        </Button>
      </div>

      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
        {MOCK_PIPELINES.map((pipeline) => (
          <motion.div key={pipeline.id} variants={staggerChild}>
            <Card hoverable={false} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  {pipeline.name}
                </h3>
                <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={() => {}}>
                  Nova Etapa
                </Button>
              </div>

              <div className="space-y-2">
                {pipeline.stages.map((stage, index) => (
                  <div
                    key={stage.id}
                    className="flex items-center gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2.5"
                  >
                    <GripVertical
                      size={14}
                      className="shrink-0 cursor-grab text-[var(--text-muted)]"
                    />
                    <div className={cn("h-3 w-3 shrink-0 rounded-full", stage.color)} />
                    <span className="flex-1 text-sm text-[var(--text-primary)]">
                      {stage.name}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      Etapa {index + 1}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

// --- Integrations Tab ---

interface Integration {
  id: string;
  name: string;
  icon: typeof MessageCircle;
  connected: boolean;
  description: string;
}

const INTEGRATIONS: Integration[] = [
  { id: "1", name: "WhatsApp", icon: MessageCircle, connected: true, description: "Envie mensagens e acompanhe conversas." },
  { id: "2", name: "Gmail", icon: Mail, connected: true, description: "Sincronize e-mails automaticamente." },
  { id: "3", name: "Google Calendar", icon: Calendar, connected: false, description: "Sincronize reuniões e eventos." },
  { id: "4", name: "Microsoft Teams", icon: MonitorSmartphone, connected: false, description: "Notificações e chamadas de vídeo." },
  { id: "5", name: "Meta Ads", icon: Megaphone, connected: false, description: "Importe leads do Facebook e Instagram." },
  { id: "6", name: "Google Ads", icon: BarChart3, connected: false, description: "Importe leads de campanhas Google." },
  { id: "7", name: "Zapier", icon: Workflow, connected: true, description: "Conecte com +5.000 aplicativos." },
  { id: "8", name: "Stripe", icon: Banknote, connected: false, description: "Gerencie pagamentos e assinaturas." },
];

function IntegrationsTab() {
  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Integrações</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Conecte suas ferramentas favoritas ao CRM.
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
          return (
            <motion.div key={integration.id} variants={staggerChild}>
              <Card className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      integration.connected
                        ? "bg-orange-500/15 text-orange-500"
                        : "bg-neutral-500/15 text-[var(--text-muted)]",
                    )}
                  >
                    <Icon size={20} />
                  </div>
                  <Badge
                    variant={integration.connected ? "success" : "default"}
                    size="sm"
                  >
                    {integration.connected ? "Conectado" : "Não conectado"}
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

                <Button
                  variant={integration.connected ? "secondary" : "primary"}
                  size="sm"
                  icon={integration.connected ? <ExternalLink size={14} /> : <Plus size={14} />}
                  className="mt-auto"
                >
                  {integration.connected ? "Configurar" : "Conectar"}
                </Button>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}

// --- Placeholder Tab ---

function PlaceholderTab({ label }: { label: string }) {
  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-500/10">
        <Workflow size={24} className="text-orange-500" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">Em breve</h3>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        Configuração de {label} estará disponível em breve.
      </p>
    </motion.div>
  );
}

// --- Main Settings Page ---

const TAB_COMPONENTS: Record<SettingsTab, () => React.JSX.Element> = {
  company: CompanyTab,
  pipelines: PipelinesTab,
  "custom-fields": () => <PlaceholderTab label="Campos Customizados" />,
  teams: () => <PlaceholderTab label="Equipes" />,
  "task-types": () => <PlaceholderTab label="Tipos de Tarefa" />,
  "loss-reasons": () => <PlaceholderTab label="Motivos de Perda" />,
  integrations: IntegrationsTab,
  notifications: () => <PlaceholderTab label="Notificações" />,
  subscription: () => <PlaceholderTab label="Assinatura" />,
  playbooks: () => <PlaceholderTab label="Playbooks" />,
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("company");

  const ActiveComponent = TAB_COMPONENTS[activeTab];

  return (
    <PageContainer title="Configurações" description="Gerencie as configurações da sua conta e organização.">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar tabs */}
        <nav className="shrink-0 lg:w-56">
          <div className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    activeTab === tab.key
                      ? "bg-orange-500/10 text-orange-500"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]",
                  )}
                >
                  <Icon size={16} className="shrink-0" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <Card hoverable={false}>
            <AnimatePresence mode="wait">
              <ActiveComponent key={activeTab} />
            </AnimatePresence>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
