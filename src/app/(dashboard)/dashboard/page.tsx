"use client";

import { useState, useEffect, useCallback } from "react";
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
  MessageSquare,
  FileText,
  Loader2,
  BarChart3,
  Receipt,
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
import { createBrowserClient } from "@/lib/supabase/client";
import { StatCard } from "@/components/data/StatCard";
import { staggerContainer, staggerChild } from "@/lib/motion";
import { cn } from "@/lib/cn";

// ─── Period selector ───────────────────────────────────────────

type Period = "today" | "week" | "month" | "quarter" | "year";

const periods: { value: Period; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "week", label: "Esta Semana" },
  { value: "month", label: "Este Mês" },
  { value: "quarter", label: "Este Trimestre" },
  { value: "year", label: "Este Ano" },
];

// ─── Task type icon map ───────────────────────────────────────

const taskIconMap: Record<string, typeof Phone> = {
  CALL: Phone,
  EMAIL: Mail,
  MEETING: Users,
  WHATSAPP: MessageSquare,
  FOLLOW_UP: Phone,
  PROPOSAL: FileText,
  CUSTOM: CheckCircle,
};

// ─── Types ────────────────────────────────────────────────────

interface DashboardData {
  stats: {
    totalDeals: number;
    totalDealsChange: number | null;
    revenue: number;
    revenueChange: number | null;
    conversionRate: number;
    conversionRateChange: number | null;
    averageTicket: number;
    averageTicketChange: number | null;
    dealsInPipeline: number;
    completedTasks: number;
    completedTasksChange: number | null;
  };
  charts: {
    revenue: { month: string; receita: number }[];
    funnel: { stage: string; deals: number; fill: string }[];
    wonLost: { month: string; ganhos: number; perdidos: number }[];
    lossReasons: { name: string; value: number; fill: string }[];
  };
  todayTasks: {
    id: string;
    title: string;
    type: string;
    status: string;
    time: string;
    contact: string;
  }[];
  recentDeals: {
    id: string;
    name: string;
    value: number;
    stage: string;
    priority: "high" | "medium" | "low";
  }[];
}

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
        <div className="h-[280px] w-full" style={{ userSelect: "none" }}>{children}</div>
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

// ─── CSV Export ────────────────────────────────────────────────

function exportDashboardCSV(data: DashboardData) {
  const lines: string[] = [];

  // Stats
  lines.push("=== Indicadores ===");
  lines.push("Métrica,Valor,Variação (%)");
  lines.push(`Receita do Período,${data.stats.revenue.toFixed(2)},${data.stats.revenueChange ?? "—"}`);
  lines.push(`Total de Deals,${data.stats.totalDeals},${data.stats.totalDealsChange ?? "—"}`);
  lines.push(`Taxa de Conversão,${data.stats.conversionRate}%,${data.stats.conversionRateChange ?? "—"}`);
  lines.push(`Ticket Médio,${data.stats.averageTicket.toFixed(2)},${data.stats.averageTicketChange ?? "—"}`);
  lines.push(`Deals em Andamento,${data.stats.dealsInPipeline},—`);
  lines.push(`Tarefas Concluídas,${data.stats.completedTasks},${data.stats.completedTasksChange ?? "—"}`);
  lines.push("");

  // Revenue chart
  lines.push("=== Receita Mensal ===");
  lines.push("Mês,Receita");
  for (const r of data.charts.revenue) {
    lines.push(`${r.month},${r.receita.toFixed(2)}`);
  }
  lines.push("");

  // Funnel
  lines.push("=== Funil de Vendas ===");
  lines.push("Etapa,Deals");
  for (const f of data.charts.funnel) {
    lines.push(`${f.stage},${f.deals}`);
  }
  lines.push("");

  // Won vs Lost
  lines.push("=== Ganhos vs Perdidos ===");
  lines.push("Mês,Ganhos,Perdidos");
  for (const w of data.charts.wonLost) {
    lines.push(`${w.month},${w.ganhos},${w.perdidos}`);
  }
  lines.push("");

  // Loss Reasons
  lines.push("=== Motivos de Perda ===");
  lines.push("Motivo,Quantidade");
  for (const l of data.charts.lossReasons) {
    lines.push(`${l.name},${l.value}`);
  }
  lines.push("");

  // Recent Deals
  lines.push("=== Deals Recentes ===");
  lines.push("Nome,Valor,Etapa,Prioridade");
  for (const d of data.recentDeals) {
    lines.push(`"${d.name}",${d.value.toFixed(2)},${d.stage},${d.priority}`);
  }

  const csv = lines.join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `dashboard-relatorio-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ─── Page ──────────────────────────────────────────────────────

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [taskChecked, setTaskChecked] = useState<Record<string, boolean>>({});

  const fetchDashboard = useCallback(async (p: Period) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard?period=${p}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // keep previous data on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function loadUser() {
      const supabase = createBrowserClient();
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUserName(
          (data.user.user_metadata?.full_name as string) ||
            data.user.email?.split("@")[0] || "Usuário",
        );
      }
    }
    loadUser();
  }, []);

  useEffect(() => {
    fetchDashboard(period);
  }, [period, fetchDashboard]);

  function handlePeriodChange(p: Period) {
    setPeriod(p);
  }

  function toggleTask(id: string) {
    setTaskChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  // Fallback empty data
  const stats = data?.stats ?? {
    totalDeals: 0, totalDealsChange: null,
    revenue: 0, revenueChange: null,
    conversionRate: 0, conversionRateChange: null,
    averageTicket: 0, averageTicketChange: null,
    dealsInPipeline: 0,
    completedTasks: 0, completedTasksChange: null,
  };
  const charts = data?.charts ?? {
    revenue: [],
    funnel: [],
    wonLost: [],
    lossReasons: [],
  };
  const todayTasks = data?.todayTasks ?? [];
  const recentDeals = data?.recentDeals ?? [];

  return (
    <PageContainer title="Dashboard" description="Visão geral do desempenho comercial">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-lg text-[var(--text-secondary)]">
          {getGreeting()}, <span className="font-semibold text-[var(--text-primary)]">{userName || "Usuário"}</span>
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-1">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => handlePeriodChange(p.value)}
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

          <button
            onClick={() => data && exportDashboardCSV(data)}
            disabled={!data}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] disabled:opacity-50"
          >
            <Download size={14} />
            Exportar Relatório
          </button>
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="mb-4 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <Loader2 size={14} className="animate-spin" />
          Carregando dados...
        </div>
      )}

      {/* Stat Cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <StatCard
          icon={<DollarSign size={22} />}
          label="Receita do Período"
          value={stats.revenue}
          prefix="R$ "
          decimals={2}
          change={stats.revenueChange}
          color="green"
        />
        <StatCard
          icon={<BarChart3 size={22} />}
          label="Total de Deals"
          value={stats.totalDeals}
          change={stats.totalDealsChange}
          color="orange"
        />
        <StatCard
          icon={<TrendingUp size={22} />}
          label="Taxa de Conversão"
          value={stats.conversionRate}
          suffix="%"
          decimals={1}
          change={stats.conversionRateChange}
          color="blue"
        />
        <StatCard
          icon={<Receipt size={22} />}
          label="Ticket Médio"
          value={stats.averageTicket}
          prefix="R$ "
          decimals={2}
          change={stats.averageTicketChange}
          color="purple"
        />
        <StatCard
          icon={<Target size={22} />}
          label="Deals em Andamento"
          value={stats.dealsInPipeline}
          color="yellow"
        />
        <StatCard
          icon={<CheckCircle size={22} />}
          label="Tarefas Concluídas"
          value={stats.completedTasks}
          change={stats.completedTasksChange}
          color="green"
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
            <BarChart data={charts.revenue} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
              <XAxis dataKey="month" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
              <YAxis
                tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                tickFormatter={(v: number) => `R$ ${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip currency />} cursor={{ fill: "rgba(249,115,22,0.08)" }} />
              <Bar dataKey="receita" name="Receita" fill="#F97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Funnel Horizontal Bar */}
        <ChartCard title="Funil de Vendas">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts.funnel} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
              <YAxis
                dataKey="stage"
                type="category"
                tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                width={100}
              />
              <Tooltip content={<CustomTooltip suffix=" deals" />} cursor={{ fill: "rgba(249,115,22,0.08)" }} />
              <Bar dataKey="deals" name="Deals" radius={[0, 4, 4, 0]}>
                {charts.funnel.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Won vs Lost Line Chart */}
        <ChartCard title="Ganhos vs Perdidos">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={charts.wonLost} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
              <XAxis dataKey="month" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
              <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
              <Tooltip content={<CustomTooltip suffix=" deals" />} cursor={{ stroke: "rgba(249,115,22,0.3)", strokeWidth: 1 }} />
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
              {charts.lossReasons.length > 0 ? (
                <Pie
                  data={charts.lossReasons}
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
                  {charts.lossReasons.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
              ) : (
                <text x="50%" y="50%" textAnchor="middle" fill="var(--text-secondary)" fontSize={14}>
                  Sem dados de perda
                </text>
              )}
              <Tooltip content={<CustomTooltip suffix=" deals" />} />
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
              {todayTasks.length === 0 && (
                <p className="py-4 text-center text-sm text-[var(--text-muted)]">
                  Nenhuma tarefa para hoje
                </p>
              )}
              {todayTasks.map((task) => {
                const Icon = taskIconMap[task.type] || CheckCircle;
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
              {recentDeals.length === 0 && (
                <p className="py-4 text-center text-sm text-[var(--text-muted)]">
                  Nenhum deal encontrado
                </p>
              )}
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
                        R$ {deal.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
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
