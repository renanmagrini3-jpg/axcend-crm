"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
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
} from "lucide-react";
import { PageContainer } from "@/components/layout";
import { Card } from "@/components/ui";
import { cn } from "@/lib/cn";
import { CompanyTab } from "./tabs/CompanyTab";
import { PipelinesTab } from "./tabs/PipelinesTab";
import { TeamsTab } from "./tabs/TeamsTab";
import { LossReasonsTab } from "./tabs/LossReasonsTab";
import { TaskTypesTab } from "./tabs/TaskTypesTab";
import { CustomFieldsTab } from "./tabs/CustomFieldsTab";
import { IntegrationsTab } from "./tabs/IntegrationsTab";
import { NotificationsTab } from "./tabs/NotificationsTab";
import { SubscriptionTab } from "./tabs/SubscriptionTab";
import { LeadDistributionTab } from "./tabs/LeadDistributionTab";

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

const TAB_COMPONENTS: Record<SettingsTab, () => React.JSX.Element> = {
  company: CompanyTab,
  pipelines: PipelinesTab,
  "custom-fields": CustomFieldsTab,
  teams: TeamsTab,
  "task-types": TaskTypesTab,
  "loss-reasons": LossReasonsTab,
  integrations: IntegrationsTab,
  notifications: NotificationsTab,
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
