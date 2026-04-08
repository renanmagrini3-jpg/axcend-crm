"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  UsersRound,
  GitBranch,
  Share2,
  Clock,
  Timer,
  DollarSign,
  BarChart3,
  TrendingUp,
  Download,
  FileSpreadsheet,
  FileText,
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
  AreaChart,
  Area,
} from "recharts";
import { PageContainer } from "@/components/layout";
import { Card, Button } from "@/components/ui";
import { StatCard } from "@/components/data/StatCard";
import { ReportCard } from "@/components/data/ReportCard";
import { staggerContainer, staggerChild } from "@/lib/motion";
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

// ─── Pre-defined reports ──────────────────────────────────────

interface ReportDef {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: "orange" | "blue" | "green" | "yellow" | "purple" | "red";
}

const predefinedReports: ReportDef[] = [
  {
    icon: <Users size={22} />,
    title: "Performance por Vendedor",
    description:
      "Ranking de vendedores com deals ganhos, receita gerada e taxa de conversão individual.",
    color: "orange",
  },
  {
    icon: <UsersRound size={22} />,
    title: "Performance por Equipe",
    description:
      "Métricas de desempenho agrupadas por equipe comercial com comparativo entre times.",
    color: "blue",
  },
  {
    icon: <GitBranch size={22} />,
    title: "Conversão por Etapa",
    description:
      "Quantidade de deals em cada etapa do funil e taxa de conversão entre as etapas.",
    color: "green",
  },
  {
    icon: <Share2 size={22} />,
    title: "Conversão por Origem",
    description:
      "Leads por origem (Facebook, Google, LinkedIn, Indicação, Orgânico) com taxa de conversão.",
    color: "purple",
  },
  {
    icon: <Clock size={22} />,
    title: "Tempo Médio de Resposta",
    description:
      "Tempo entre o lead entrar e a primeira interação, detalhado por vendedor.",
    color: "yellow",
  },
  {
    icon: <Timer size={22} />,
    title: "Ciclo Médio de Venda",
    description:
      "Tempo médio desde a abertura do deal até o fechamento, por etapa e vendedor.",
    color: "red",
  },
  {
    icon: <DollarSign size={22} />,
    title: "Receita por Período",
    description:
      "Receita total e recorrente por mês, trimestre e ano com evolução temporal.",
    color: "green",
  },
  {
    icon: <BarChart3 size={22} />,
    title: "Atividades por Vendedor",
    description:
      "Ligações, e-mails, reuniões e tarefas realizadas por cada vendedor no período.",
    color: "blue",
  },
  {
    icon: <TrendingUp size={22} />,
    title: "Previsão de Receita",
    description:
      "Forecast baseado no pipeline atual com probabilidade ponderada por etapa.",
    color: "orange",
  },
];

// ─── Mock Chart Data ──────────────────────────────────────────

const conversionByStageData = [
  { stage: "Prospecção", total: 120, convertidos: 85, taxa: 70.8 },
  { stage: "Qualificação", total: 85, convertidos: 58, taxa: 68.2 },
  { stage: "Proposta", total: 58, convertidos: 38, taxa: 65.5 },
  { stage: "Negociação", total: 38, convertidos: 22, taxa: 57.9 },
  { stage: "Fechamento", total: 22, convertidos: 18, taxa: 81.8 },
];

const conversionBySourceData = [
  { name: "Google Ads", leads: 340, convertidos: 52, fill: "#F97316" },
  { name: "Facebook", leads: 280, convertidos: 36, fill: "#FB923C" },
  { name: "LinkedIn", leads: 150, convertidos: 28, fill: "#FDBA74" },
  { name: "Indicação", leads: 95, convertidos: 32, fill: "#10B981" },
  { name: "Orgânico", leads: 210, convertidos: 25, fill: "#A3A3A3" },
];

const revenueByMonthData = [
  { month: "Jan", receita: 85000, recorrente: 42000 },
  { month: "Fev", receita: 92000, recorrente: 45000 },
  { month: "Mar", receita: 78000, recorrente: 47000 },
  { month: "Abr", receita: 110000, recorrente: 52000 },
  { month: "Mai", receita: 105000, recorrente: 55000 },
  { month: "Jun", receita: 127450, recorrente: 58000 },
];

const sellerPerformanceData = [
  { name: "Ana Silva", ganhos: 24, receita: 285000, conversao: 32.4 },
  { name: "Carlos Souza", ganhos: 19, receita: 210000, conversao: 28.1 },
  { name: "Mariana Lima", ganhos: 17, receita: 195000, conversao: 26.5 },
  { name: "Pedro Oliveira", ganhos: 15, receita: 178000, conversao: 24.8 },
  { name: "Julia Santos", ganhos: 12, receita: 145000, conversao: 22.1 },
];

const activityByWeekData = [
  { semana: "Sem 1", ligacoes: 45, emails: 120, reunioes: 12 },
  { semana: "Sem 2", ligacoes: 52, emails: 98, reunioes: 15 },
  { semana: "Sem 3", ligacoes: 38, emails: 110, reunioes: 10 },
  { semana: "Sem 4", ligacoes: 60, emails: 135, reunioes: 18 },
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

// ─── Ranking Table ─────────────────────────────────────────────

function SellerRankingTable() {
  return (
    <motion.div variants={staggerChild}>
      <Card hoverable={false} className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Ranking de Vendedores
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border-default)]">
                <th className="pb-3 pr-4 text-xs font-medium text-[var(--text-secondary)]">#</th>
                <th className="pb-3 pr-4 text-xs font-medium text-[var(--text-secondary)]">Vendedor</th>
                <th className="pb-3 pr-4 text-right text-xs font-medium text-[var(--text-secondary)]">Ganhos</th>
                <th className="pb-3 pr-4 text-right text-xs font-medium text-[var(--text-secondary)]">Receita</th>
                <th className="pb-3 text-right text-xs font-medium text-[var(--text-secondary)]">Conversão</th>
              </tr>
            </thead>
            <tbody>
              {sellerPerformanceData.map((seller, i) => (
                <tr
                  key={seller.name}
                  className="border-b border-[var(--border-default)] last:border-0"
                >
                  <td className="py-3 pr-4">
                    <span
                      className={cn(
                        "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                        i === 0
                          ? "bg-orange-500/10 text-orange-500"
                          : i === 1
                            ? "bg-neutral-400/10 text-neutral-400"
                            : i === 2
                              ? "bg-amber-600/10 text-amber-600"
                              : "bg-[var(--bg-elevated)] text-[var(--text-secondary)]",
                      )}
                    >
                      {i + 1}
                    </span>
                  </td>
                  <td className="py-3 pr-4 font-medium text-[var(--text-primary)]">
                    {seller.name}
                  </td>
                  <td className="py-3 pr-4 text-right text-[var(--text-primary)]">
                    {seller.ganhos}
                  </td>
                  <td className="py-3 pr-4 text-right text-[var(--text-primary)]">
                    R$ {seller.receita.toLocaleString("pt-BR")}
                  </td>
                  <td className="py-3 text-right">
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">
                      {seller.conversao}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
}

// ─── Page ──────────────────────────────────────────────────────

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>("month");

  return (
    <PageContainer title="Relatórios" description="Análises detalhadas e relatórios do desempenho comercial">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={<FileText size={14} />}>
            Exportar PDF
          </Button>
          <Button variant="secondary" size="sm" icon={<FileSpreadsheet size={14} />}>
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          icon={<FileText size={22} />}
          label="Relatórios Gerados"
          value={48}
          change={15.3}
          color="orange"
        />
        <StatCard
          icon={<TrendingUp size={22} />}
          label="Taxa de Conversão Geral"
          value={23.5}
          suffix="%"
          decimals={1}
          change={3.2}
          color="green"
        />
        <StatCard
          icon={<Clock size={22} />}
          label="Tempo Médio de Resposta"
          value={2.4}
          suffix="h"
          decimals={1}
          change={-12.5}
          color="blue"
        />
        <StatCard
          icon={<Timer size={22} />}
          label="Ciclo Médio de Venda"
          value={18}
          suffix=" dias"
          change={-8.2}
          color="yellow"
        />
      </motion.div>

      {/* Pre-defined Reports Grid */}
      <div className="mb-6">
        <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">
          Relatórios Pré-definidos
        </h2>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {predefinedReports.map((report) => (
            <ReportCard
              key={report.title}
              icon={report.icon}
              title={report.title}
              description={report.description}
              color={report.color}
            />
          ))}
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="mb-6">
        <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">
          Visão Geral Analítica
        </h2>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2"
        >
          {/* Conversion by Stage */}
          <ChartCard title="Conversão por Etapa do Funil">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conversionByStageData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                <XAxis dataKey="stage" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
                <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12 }}
                  formatter={(value: string) => (
                    <span style={{ color: "var(--text-secondary)" }}>{value}</span>
                  )}
                />
                <Bar dataKey="total" name="Total" fill="#A3A3A3" radius={[4, 4, 0, 0]} />
                <Bar dataKey="convertidos" name="Convertidos" fill="#F97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Revenue Evolution */}
          <ChartCard title="Evolução da Receita">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueByMonthData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="recurringGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                <XAxis dataKey="month" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
                <YAxis
                  tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                  tickFormatter={(v: number) => `R$ ${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip currency />} />
                <Legend
                  wrapperStyle={{ fontSize: 12 }}
                  formatter={(value: string) => (
                    <span style={{ color: "var(--text-secondary)" }}>{value}</span>
                  )}
                />
                <Area
                  type="monotone"
                  dataKey="receita"
                  name="Receita Total"
                  stroke="#F97316"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="recorrente"
                  name="Receita Recorrente"
                  stroke="#10B981"
                  strokeWidth={2}
                  fill="url(#recurringGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Conversion by Source */}
          <ChartCard title="Leads e Conversão por Origem">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conversionBySourceData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                <XAxis dataKey="name" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
                <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12 }}
                  formatter={(value: string) => (
                    <span style={{ color: "var(--text-secondary)" }}>{value}</span>
                  )}
                />
                <Bar dataKey="leads" name="Leads" radius={[4, 4, 0, 0]}>
                  {conversionBySourceData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
                <Bar dataKey="convertidos" name="Convertidos" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Activity by Week */}
          <ChartCard title="Atividades por Semana">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityByWeekData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                <XAxis dataKey="semana" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
                <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12 }}
                  formatter={(value: string) => (
                    <span style={{ color: "var(--text-secondary)" }}>{value}</span>
                  )}
                />
                <Line
                  type="monotone"
                  dataKey="ligacoes"
                  name="Ligações"
                  stroke="#F97316"
                  strokeWidth={2}
                  dot={{ fill: "#F97316", r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="emails"
                  name="E-mails"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ fill: "#3B82F6", r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="reunioes"
                  name="Reuniões"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ fill: "#10B981", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </motion.div>
      </div>

      {/* Seller Ranking */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <SellerRankingTable />
      </motion.div>
    </PageContainer>
  );
}
