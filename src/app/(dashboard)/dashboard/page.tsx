"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  Target,
  TrendingUp,
  CheckCircle,
  Download,
  Calendar,
  Clock,
  Phone,
  Mail,
  Users,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { PageContainer } from "@/components/layout";
import { Card, Badge } from "@/components/ui";
import { StatCard } from "@/components/data/StatCard";
import { staggerContainer, staggerChild, fadeInUp } from "@/lib/motion";
import { cn } from "@/lib/cn";

// ─── Period selector ───────────────────────────────────────────

type Period = "today" | "week" | "month" | "quarter" | "year" | "custom";

const periods: { value: Period; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "week", label: "Esta Semana" },
  { value: "month", label: "Este Mês" },
  { value: "quarter", label: "Este Trimestre" },
  { value: "year", label: "Este Ano" },
  { value: "custom", label: "Personalizado" },
];

// ─── Mock Data ─────────────────────────────────────────────────

const revenueData = [
  { month: "Jan", receita: 85000 },
  { month: "Fev", receita: 92000 },
  { month: "Mar", receita: 78000 },
  { month: "Abr", receita: 110000 },
  { month: "Mai", receita: 105000 },
  { month: "Jun", receita: 127450 },
];

const funnelData = [
  { stage: "Prospecção", deals: 45, fill: "#F97316" },
  { stage: "Qualificação", deals: 34, fill: "#FB923C" },
  { stage: "Proposta", deals: 22, fill: "#FDBA74" },
  { stage: "Negociação", deals: 15, fill: "#A3A3A3" },
  { stage: "Fechamento", deals: 8, fill: "#737373" },
];

const wonLostData = [
  { month: "Jan", ganhos: 12, perdidos: 5 },
  { month: "Fev", ganhos: 15, perdidos: 7 },
  { month: "Mar", ganhos: 10, perdidos: 8 },
  { month: "Abr", ganhos: 18, perdidos: 4 },
  { month: "Mai", ganhos: 20, perdidos: 6 },
  { month: "Jun", ganhos: 16, perdidos: 5 },
];

const lossReasonsData = [
  { name: "Preço", value: 30, fill: "#F97316" },
  { name: "Concorrência", value: 25, fill: "#FB923C" },
  { name: "Timing", value: 20, fill: "#FDBA74" },
  { name: "Sem resposta", value: 15, fill: "#A3A3A3" },
  { name: "Outro", value: 10, fill: "#525252" },
];

const todayTasks = [
  { id: 1, title: "Ligar para João Silva", type: "Ligação", contact: "João Silva", time: "09:00", done: false, icon: Phone },
  { id: 2, title: "Enviar proposta Acme Corp", type: "E-mail", contact: "Maria Souza", time: "10:30", done: false, icon: Mail },
  { id: 3, title: "Follow-up Tech Solutions", type: "Ligação", contact: "Pedro Oliveira", time: "14:00", done: true, icon: Phone },
  { id: 4, title: "Reunião com time comercial", type: "Reunião", contact: "Equipe", time: "15:00", done: false, icon: Users },
  { id: 5, title: "Atualizar CRM deals Q2", type: "Tarefa", contact: "—", time: "17:00", done: false, icon: CheckCircle },
];

const recentDeals = [
  { id: 1, name: "Acme Corp - Enterprise", value: 45000, stage: "Proposta", priority: "high" as const },
  { id: 2, name: "Tech Solutions SaaS", value: 28000, stage: "Negociação", priority: "high" as const },
  { id: 3, name: "StartupX Onboarding", value: 12000, stage: "Qualificação", priority: "medium" as const },
  { id: 4, name: "Global Logistics CRM", value: 67000, stage: "Fechamento", priority: "high" as const },
  { id: 5, name: "Retail Plus - Módulo", value: 8500, stage: "Prospecção", priority: "low" as const },
];

// ─── Custom Tooltip ────────────────────────────────────────────

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  currency?: boolean;
  suffix?: string;
}

function CustomTooltip({ active, payload, label, currency, suffix }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs font-medium text-[var(--text-secondary)]">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}:{" "}
          {currency
            ? `R$ ${entry.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
            : `${entry.value.toLocaleString("pt-BR")}${suffix ?? ""}`}
        </p>
      ))}
    </div>
  );
}

// ─── Chart Card wrapper ────────────────────────────────────────

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div variants={staggerChild}>
      <Card hoverable={false} className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
        <div className="h-[280px] w-full">{children}</div>
      </Card>
    </motion.div>
  );
}

// ─── Priority badge mapper ─────────────────────────────────────

const priorityMap = {
  high: { label: "Alta", variant: "danger" as const },
  medium: { label: "Média", variant: "warning" as const },
  low: { label: "Baixa", variant: "info" as const },
};

// ─── Greeting helper ───────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

// ─── Page ──────────────────────────────────────────────────────

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [taskChecked, setTaskChecked] = useState<Record<number, boolean>>(
    Object.fromEntries(todayTasks.map((t) => [t.id, t.done])),
  );

  function toggleTask(id: number) {
    setTaskChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <PageContainer title="Dashboard" description="Visão geral do desempenho comercial">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-lg text-[var(--text-secondary)]">
          {getGreeting()}, <span className="font-semibold text-[var(--text-primary)]">Usuário</span>
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-1">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  period === p.value
                    ? "bg-orange-500 text-white"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">
            <Download size={14} />
            Exportar Relatório
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          icon={<DollarSign size={22} />}
          label="Receita do Mês"
          value={127450}
          prefix="R$ "
          decimals={2}
          change={12.5}
          color="green"
        />
        <StatCard
          icon={<Target size={22} />}
          label="Deals no Pipeline"
          value={34}
          color="orange"
        />
        <StatCard
          icon={<TrendingUp size={22} />}
          label="Taxa de Conversão"
          value={23.5}
          suffix="%"
          decimals={1}
          change={3.2}
          color="blue"
        />
        <StatCard
          icon={<CheckCircle size={22} />}
          label="Tarefas Pendentes"
          value={12}
          color="yellow"
        />
      </motion.div>

      {/* Charts Grid */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2"
      >
        {/* Revenue Bar Chart */}
        <ChartCard title="Receita Mensal">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
              <XAxis dataKey="month" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
              <YAxis
                tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                tickFormatter={(v: number) => `R$ ${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip currency />} />
              <Bar dataKey="receita" name="Receita" fill="#F97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Funnel Horizontal Bar */}
        <ChartCard title="Funil de Vendas">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
              <YAxis
                dataKey="stage"
                type="category"
                tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                width={100}
              />
              <Tooltip content={<CustomTooltip suffix=" deals" />} />
              <Bar dataKey="deals" name="Deals" radius={[0, 4, 4, 0]}>
                {funnelData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Won vs Lost Line Chart */}
        <ChartCard title="Ganhos vs Perdidos">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={wonLostData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
              <XAxis dataKey="month" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
              <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
              <Tooltip content={<CustomTooltip suffix=" deals" />} />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                formatter={(value: string) => (
                  <span style={{ color: "var(--text-secondary)" }}>{value}</span>
                )}
              />
              <Line
                type="monotone"
                dataKey="ganhos"
                name="Ganhos"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: "#10B981", r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="perdidos"
                name="Perdidos"
                stroke="#EF4444"
                strokeWidth={2}
                dot={{ fill: "#EF4444", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Loss Reasons Donut */}
        <ChartCard title="Motivos de Perda">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={lossReasonsData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }: { name?: string; percent?: number }) =>
                  `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
                labelLine={{ stroke: "var(--text-secondary)" }}
              >
                {lossReasonsData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip suffix="%" />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </motion.div>

      {/* Bottom Section: Tasks + Recent Deals */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-4 lg:grid-cols-2"
      >
        {/* Today Tasks */}
        <motion.div variants={staggerChild}>
          <Card hoverable={false} className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Tarefas de Hoje</h3>
              <span className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                <Calendar size={12} />
                {new Date().toLocaleDateString("pt-BR")}
              </span>
            </div>

            <div className="flex flex-col divide-y divide-[var(--border-default)]">
              {todayTasks.map((task) => {
                const Icon = task.icon;
                const checked = taskChecked[task.id] ?? false;
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                        checked
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-[var(--border-default)] text-transparent hover:border-[var(--text-secondary)]",
                      )}
                    >
                      {checked && <CheckCircle size={12} />}
                    </button>

                    <Icon size={14} className="shrink-0 text-[var(--text-secondary)]" />

                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "truncate text-sm",
                          checked
                            ? "text-[var(--text-muted)] line-through"
                            : "text-[var(--text-primary)]",
                        )}
                      >
                        {task.title}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">{task.contact}</p>
                    </div>

                    <span className="flex shrink-0 items-center gap-1 text-xs text-[var(--text-secondary)]">
                      <Clock size={10} />
                      {task.time}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>

        {/* Recent Deals */}
        <motion.div variants={staggerChild}>
          <Card hoverable={false} className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Deals Recentes</h3>

            <div className="flex flex-col divide-y divide-[var(--border-default)]">
              {recentDeals.map((deal) => {
                const prio = priorityMap[deal.priority];
                return (
                  <div
                    key={deal.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                        {deal.name}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">{deal.stage}</p>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-sm font-semibold text-[var(--text-primary)]">
                        R$ {deal.value.toLocaleString("pt-BR")}
                      </span>
                      <Badge variant={prio.variant} size="sm">
                        {prio.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </PageContainer>
  );
}
