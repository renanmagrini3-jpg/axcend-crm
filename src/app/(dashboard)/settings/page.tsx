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
  Shuffle,
  Plus,
  ExternalLink,
  MessageCircle,
  Mail,
  Calendar,
  MonitorSmartphone,
  Megaphone,
  BarChart3,
  Workflow,
  Banknote,
  Download,
  TrendingUp,
  RefreshCw,
  Share2,
  DollarSign,
  FileQuestion,
  MapPin,
  Copy,
  Pencil,
  Trash2,
} from "lucide-react";
import { PageContainer } from "@/components/layout";
import { Card, Button, Badge } from "@/components/ui";
import { fadeIn, staggerContainer, staggerChild } from "@/lib/motion";
import { cn } from "@/lib/cn";
import { CompanyTab } from "./tabs/CompanyTab";
import { PipelinesTab } from "./tabs/PipelinesTab";
import { TeamsTab } from "./tabs/TeamsTab";
import { LossReasonsTab } from "./tabs/LossReasonsTab";
import { TaskTypesTab } from "./tabs/TaskTypesTab";

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
  | "lead-distribution";

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
  { key: "lead-distribution", label: "Distribuição de Leads", icon: Shuffle },
];

// --- Integrations Tab (mock) ---

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

// --- Subscription Tab (mock) ---

interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: "paid" | "pending";
}

const MOCK_INVOICES: Invoice[] = [
  { id: "INV-001", date: "08/04/2026", amount: "R$ 500,00", status: "paid" },
  { id: "INV-002", date: "08/03/2026", amount: "R$ 500,00", status: "paid" },
  { id: "INV-003", date: "08/02/2026", amount: "R$ 500,00", status: "paid" },
  { id: "INV-004", date: "08/01/2026", amount: "R$ 500,00", status: "pending" },
];

function SubscriptionTab() {
  const usedSeats = 8;
  const totalSeats = 10;
  const seatPercent = (usedSeats / totalSeats) * 100;

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Assinatura</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Gerencie seu plano e histórico de faturas.
        </p>
      </div>

      <Card hoverable={false} className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/15">
              <TrendingUp size={22} className="text-orange-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  Axcend Pro
                </h3>
                <Badge variant="success" size="sm">
                  Ativo
                </Badge>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">R$ 500/mês</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm">
              Alterar Plano
            </Button>
            <Button size="sm" icon={<ExternalLink size={14} />}>
              Gerenciar Assinatura
            </Button>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-[var(--text-secondary)]">Usuários</span>
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {usedSeats} de {totalSeats}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-elevated)]">
            <div
              className="h-full rounded-full bg-orange-500 transition-all"
              style={{ width: `${seatPercent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-[var(--bg-elevated)] px-4 py-3">
          <Calendar size={16} className="text-[var(--text-muted)]" />
          <span className="text-sm text-[var(--text-secondary)]">
            Próxima cobrança:{" "}
            <span className="font-medium text-[var(--text-primary)]">08/05/2026</span>
          </span>
        </div>
      </Card>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
          Histórico de Faturas
        </h3>
        <Card hoverable={false} className="overflow-hidden !p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-default)] bg-[var(--bg-elevated)]">
                <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Data</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Valor</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Status</th>
                <th className="px-4 py-3 text-right font-medium text-[var(--text-secondary)]">Ação</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_INVOICES.map((inv) => (
                <tr key={inv.id} className="border-b border-[var(--border-subtle)] last:border-0">
                  <td className="px-4 py-3 text-[var(--text-primary)]">{inv.date}</td>
                  <td className="px-4 py-3 text-[var(--text-primary)]">{inv.amount}</td>
                  <td className="px-4 py-3">
                    <Badge variant={inv.status === "paid" ? "success" : "warning"} size="sm">
                      {inv.status === "paid" ? "Pago" : "Pendente"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="inline-flex items-center gap-1 text-xs text-orange-500 transition-colors hover:text-orange-400">
                      <Download size={14} />
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </motion.div>
  );
}

// --- Lead Distribution Tab (mock) ---

interface DistributionRule {
  id: string;
  name: string;
  description: string;
  icon: typeof RefreshCw;
  active: boolean;
  priority: number;
  lastRun: string;
  leadsDistributed: number;
}

const DISTRIBUTION_RULES_DATA: DistributionRule[] = [
  { id: "1", name: "Round Robin", description: "Distribuição igualitária e sequencial entre todos os vendedores", icon: RefreshCw, active: true, priority: 1, lastRun: "Hoje, 14:32", leadsDistributed: 142 },
  { id: "2", name: "Por Origem", description: "Leads do Facebook Ads → Equipe A | Google Ads → Equipe B | Indicação → Vendedor Senior", icon: Share2, active: true, priority: 2, lastRun: "Hoje, 14:30", leadsDistributed: 87 },
  { id: "3", name: "Por Valor Aproximado", description: "Deals acima de R$ 50.000 → Vendedor Senior | Abaixo → Distribuição normal", icon: DollarSign, active: false, priority: 3, lastRun: "Ontem, 18:00", leadsDistributed: 34 },
  { id: "4", name: "Por Resposta do Formulário", description: "Se 'Tipo de Seguro' = 'Vida' → Especialista Vida | 'Saúde' → Especialista Saúde", icon: FileQuestion, active: false, priority: 4, lastRun: "07/04/2026", leadsDistributed: 56 },
  { id: "5", name: "Por Capacidade", description: "Vendedor com menos deals ativos recebe o próximo lead", icon: BarChart3, active: true, priority: 5, lastRun: "Hoje, 14:32", leadsDistributed: 203 },
  { id: "6", name: "Por Região/Território", description: "Leads de SP → Equipe SP | RJ → Equipe RJ | Outros → Pool geral", icon: MapPin, active: false, priority: 6, lastRun: "05/04/2026", leadsDistributed: 45 },
  { id: "7", name: "Duplicação/Peso", description: "Duplicar lead para supervisor quando valor > R$ 100.000", icon: Copy, active: false, priority: 7, lastRun: "03/04/2026", leadsDistributed: 12 },
];

interface SellerCapacity {
  id: string;
  name: string;
  team: string;
  activeDeals: number;
  maxLimit: number;
  weight: number;
  status: "receiving" | "paused";
}

const SELLERS_CAPACITY: SellerCapacity[] = [
  { id: "s1", name: "Ana Paula", team: "Equipe A", activeDeals: 12, maxLimit: 20, weight: 100, status: "receiving" },
  { id: "s2", name: "Ricardo Souza", team: "Equipe A", activeDeals: 18, maxLimit: 20, weight: 100, status: "receiving" },
  { id: "s3", name: "Carlos Lima", team: "Equipe B", activeDeals: 8, maxLimit: 20, weight: 150, status: "receiving" },
  { id: "s4", name: "Juliana Mendes", team: "Equipe B", activeDeals: 15, maxLimit: 20, weight: 100, status: "paused" },
  { id: "s5", name: "Thiago Santos", team: "Equipe C", activeDeals: 5, maxLimit: 20, weight: 75, status: "receiving" },
];

function LeadDistributionTab() {
  const [autoDistribution, setAutoDistribution] = useState(true);
  const [rules, setRules] = useState<DistributionRule[]>(DISTRIBUTION_RULES_DATA);

  const priorityLabel = (p: number) => `${p}ª`;

  const toggleRule = (id: string) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r)));
  };

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Distribuição de Leads</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Configure regras automáticas para distribuir leads entre vendedores.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--text-secondary)]">Distribuição automática</span>
          <button
            onClick={() => setAutoDistribution(!autoDistribution)}
            className={cn(
              "relative h-6 w-11 rounded-full transition-colors",
              autoDistribution ? "bg-orange-500" : "bg-neutral-700",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                autoDistribution && "translate-x-5",
              )}
            />
          </button>
        </div>
      </div>

      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
        {rules.map((rule) => {
          const Icon = rule.icon;
          return (
            <motion.div key={rule.id} variants={staggerChild}>
              <Card hoverable={false} className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500/10">
                      <Icon size={18} className="text-orange-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                          {rule.name}
                        </h3>
                        <Badge variant="default" size="sm">
                          {priorityLabel(rule.priority)}
                        </Badge>
                        {rule.name === "Round Robin" && (
                          <Badge variant="success" size="sm">
                            Padrão
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                        {rule.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleRule(rule.id)}
                      className={cn(
                        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                        rule.active ? "bg-orange-500" : "bg-neutral-700",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                          rule.active && "translate-x-5",
                        )}
                      />
                    </button>
                    <button className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]">
                      <Pencil size={14} />
                    </button>
                    <button className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 border-t border-[var(--border-default)] pt-3 text-xs text-[var(--text-muted)]">
                  <span>Última execução: {rule.lastRun}</span>
                  <span>{rule.leadsDistributed} leads distribuídos</span>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
          Capacidade dos Vendedores
        </h3>
        <Card hoverable={false} className="overflow-hidden !p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-default)] bg-[var(--bg-elevated)]">
                <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Equipe</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Deals Ativos</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Limite Máx</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Peso (%)</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">Status</th>
              </tr>
            </thead>
            <tbody>
              {SELLERS_CAPACITY.map((seller) => (
                <tr key={seller.id} className="border-b border-[var(--border-subtle)] last:border-0">
                  <td className="px-4 py-3 text-[var(--text-primary)]">{seller.name}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{seller.team}</td>
                  <td className="px-4 py-3 text-[var(--text-primary)]">{seller.activeDeals}</td>
                  <td className="px-4 py-3 text-[var(--text-primary)]">{seller.maxLimit}</td>
                  <td className="px-4 py-3 text-[var(--text-primary)]">{seller.weight}%</td>
                  <td className="px-4 py-3">
                    <Badge variant={seller.status === "receiving" ? "success" : "warning"} size="sm">
                      {seller.status === "receiving" ? "Recebendo" : "Pausado"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
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
  teams: TeamsTab,
  "task-types": TaskTypesTab,
  "loss-reasons": LossReasonsTab,
  integrations: IntegrationsTab,
  notifications: () => <PlaceholderTab label="Notificações" />,
  subscription: SubscriptionTab,
  "lead-distribution": LeadDistributionTab,
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("company");

  const ActiveComponent = TAB_COMPONENTS[activeTab];

  return (
    <PageContainer title="Configurações" description="Gerencie as configurações da sua conta e organização.">
      <div className="flex flex-col gap-6 lg:flex-row">
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
