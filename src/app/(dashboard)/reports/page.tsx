"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  ChevronDown,
  Loader2,
  Search,
  Send,
  X,
} from "lucide-react";
import {
  BarChart,
  Bar,
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

// ─── Types ────────────────────────────────────────────────────

type Period = "today" | "week" | "month" | "quarter" | "year" | "custom";

type ReportType =
  | "vendor-performance"
  | "origin-conversion"
  | "loss-reasons"
  | "stage-conversion"
  | "revenue-period"
  | "response-time"
  | "team-performance"
  | "activities"
  | "revenue-forecast";

interface VendorRow {
  name: string;
  won: number;
  lost: number;
  total: number;
  revenue: number;
  conversao: number;
}

interface OriginRow {
  name: string;
  leads: number;
  conversoes: number;
  receita: number;
  taxa: number;
  fill: string;
}

interface LossRow {
  name: string;
  count: number;
  percentual: number;
  fill: string;
}

interface StageRow {
  stage: string;
  total: number;
  convertidos: number;
  taxa: number;
}

interface RevenueRow {
  month: string;
  receita: number;
}

interface ActivityRow {
  name: string;
  total: number;
  completed: number;
  pending: number;
  calls: number;
  emails: number;
  meetings: number;
  followups: number;
}

interface ForecastRow {
  name: string;
  value: number;
  probability: number;
  weighted: number;
  stage: string;
}

interface ResponseTimeRow {
  name: string;
  hoursToRespond: number;
  bucket: string;
}

type ReportData = VendorRow[] | OriginRow[] | LossRow[] | StageRow[] | RevenueRow[] | ActivityRow[] | ForecastRow[] | ResponseTimeRow[];

interface ReportState {
  loading: boolean;
  data: ReportData | null;
  error: string | null;
  message?: string;
}

const periods: { value: Period; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "week", label: "Esta Semana" },
  { value: "month", label: "Este Mês" },
  { value: "quarter", label: "Este Trimestre" },
  { value: "year", label: "Este Ano" },
];

// ─── Report definitions ──────────────────────────────────────

interface ReportDef {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: "orange" | "blue" | "green" | "yellow" | "purple" | "red";
  apiType: ReportType;
}

const predefinedReports: ReportDef[] = [
  {
    icon: <Users size={22} />,
    title: "Performance por Vendedor",
    description: "Ranking de vendedores com deals ganhos, receita gerada e taxa de conversão individual.",
    color: "orange",
    apiType: "vendor-performance",
  },
  {
    icon: <UsersRound size={22} />,
    title: "Performance por Equipe",
    description: "Métricas de desempenho agrupadas por equipe comercial com comparativo entre times.",
    color: "blue",
    apiType: "team-performance",
  },
  {
    icon: <GitBranch size={22} />,
    title: "Conversão por Etapa",
    description: "Quantidade de deals em cada etapa do funil e taxa de conversão entre as etapas.",
    color: "green",
    apiType: "stage-conversion",
  },
  {
    icon: <Share2 size={22} />,
    title: "Conversão por Origem",
    description: "Leads por origem com taxa de conversão e receita gerada.",
    color: "purple",
    apiType: "origin-conversion",
  },
  {
    icon: <Clock size={22} />,
    title: "Tempo Médio de Resposta",
    description: "Tempo entre o lead entrar e a primeira interação, detalhado por vendedor.",
    color: "yellow",
    apiType: "response-time",
  },
  {
    icon: <Timer size={22} />,
    title: "Motivos de Perda",
    description: "Principais motivos de perda de deals com percentual e tendências.",
    color: "red",
    apiType: "loss-reasons",
  },
  {
    icon: <DollarSign size={22} />,
    title: "Receita por Período",
    description: "Receita total por mês nos últimos 12 meses com evolução temporal.",
    color: "green",
    apiType: "revenue-period",
  },
  {
    icon: <BarChart3 size={22} />,
    title: "Atividades por Vendedor",
    description: "Ligações, e-mails, reuniões e tarefas realizadas por cada vendedor no período.",
    color: "blue",
    apiType: "activities",
  },
  {
    icon: <TrendingUp size={22} />,
    title: "Previsão de Receita",
    description: "Forecast baseado no pipeline atual com probabilidade ponderada por etapa.",
    color: "orange",
    apiType: "revenue-forecast",
  },
];

// ─── Tooltip ──────────────────────────────────────────────────

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

// ─── Export CSV ────────────────────────────────────────────────

function exportCSV(data: ReportData, filename: string) {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(";"),
    ...data.map((row) =>
      headers.map((h) => {
        const val = (row as unknown as Record<string, unknown>)[h];
        return typeof val === "number" ? String(val).replace(".", ",") : String(val ?? "");
      }).join(";")
    ),
  ];

  const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Expanded Report Renderers ────────────────────────────────

function VendorPerformanceReport({ data }: { data: VendorRow[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
            <XAxis dataKey="name" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
            <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v: string) => <span style={{ color: "var(--text-secondary)" }}>{v}</span>} />
            <Bar dataKey="won" name="Ganhos" fill="#10B981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="lost" name="Perdidos" fill="#EF4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border-default)]">
              <th className="pb-3 pr-4 text-xs font-medium text-[var(--text-secondary)]">#</th>
              <th className="pb-3 pr-4 text-xs font-medium text-[var(--text-secondary)]">Vendedor</th>
              <th className="pb-3 pr-4 text-right text-xs font-medium text-[var(--text-secondary)]">Ganhos</th>
              <th className="pb-3 pr-4 text-right text-xs font-medium text-[var(--text-secondary)]">Perdidos</th>
              <th className="pb-3 pr-4 text-right text-xs font-medium text-[var(--text-secondary)]">Receita</th>
              <th className="pb-3 text-right text-xs font-medium text-[var(--text-secondary)]">Conversão</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={row.name} className="border-b border-[var(--border-default)] last:border-0">
                <td className="py-3 pr-4">
                  <span className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                    i === 0 ? "bg-orange-500/10 text-orange-500"
                      : i === 1 ? "bg-neutral-400/10 text-neutral-400"
                      : i === 2 ? "bg-amber-600/10 text-amber-600"
                      : "bg-[var(--bg-elevated)] text-[var(--text-secondary)]",
                  )}>{i + 1}</span>
                </td>
                <td className="py-3 pr-4 font-medium text-[var(--text-primary)]">{row.name}</td>
                <td className="py-3 pr-4 text-right text-emerald-500">{row.won}</td>
                <td className="py-3 pr-4 text-right text-red-500">{row.lost}</td>
                <td className="py-3 pr-4 text-right text-[var(--text-primary)]">
                  R$ {row.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 text-right">
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">
                    {row.conversao}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OriginConversionReport({ data }: { data: OriginRow[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="leads"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(props: { name?: string; percent?: number }) =>
                  `${props.name ?? ""} ${((props.percent ?? 0) * 100).toFixed(0)}%`
                }
                labelLine={{ stroke: "var(--text-secondary)" }}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
              <XAxis dataKey="name" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
              <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="leads" name="Leads" radius={[4, 4, 0, 0]}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
              <Bar dataKey="conversoes" name="Conversões" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border-default)]">
              <th className="pb-3 pr-4 text-xs font-medium text-[var(--text-secondary)]">Origem</th>
              <th className="pb-3 pr-4 text-right text-xs font-medium text-[var(--text-secondary)]">Leads</th>
              <th className="pb-3 pr-4 text-right text-xs font-medium text-[var(--text-secondary)]">Conversões</th>
              <th className="pb-3 pr-4 text-right text-xs font-medium text-[var(--text-secondary)]">Taxa</th>
              <th className="pb-3 text-right text-xs font-medium text-[var(--text-secondary)]">Receita</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.name} className="border-b border-[var(--border-default)] last:border-0">
                <td className="py-3 pr-4 font-medium text-[var(--text-primary)]">
                  <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.fill }} />
                  {row.name}
                </td>
                <td className="py-3 pr-4 text-right text-[var(--text-primary)]">{row.leads}</td>
                <td className="py-3 pr-4 text-right text-[var(--text-primary)]">{row.conversoes}</td>
                <td className="py-3 pr-4 text-right">
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">
                    {row.taxa}%
                  </span>
                </td>
                <td className="py-3 text-right text-[var(--text-primary)]">
                  R$ {row.receita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LossReasonsReport({ data }: { data: LossRow[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
            <XAxis type="number" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
              width={70}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" name="Quantidade" radius={[0, 4, 4, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border-default)]">
              <th className="pb-3 pr-4 text-xs font-medium text-[var(--text-secondary)]">Motivo</th>
              <th className="pb-3 pr-4 text-right text-xs font-medium text-[var(--text-secondary)]">Quantidade</th>
              <th className="pb-3 text-right text-xs font-medium text-[var(--text-secondary)]">Percentual</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.name} className="border-b border-[var(--border-default)] last:border-0">
                <td className="py-3 pr-4 font-medium text-[var(--text-primary)]">
                  <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.fill }} />
                  {row.name}
                </td>
                <td className="py-3 pr-4 text-right text-[var(--text-primary)]">{row.count}</td>
                <td className="py-3 text-right">
                  <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-500">
                    {row.percentual}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RevenuePeriodReport({ data }: { data: RevenueRow[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
            <XAxis dataKey="month" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
            <YAxis
              tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
              tickFormatter={(v: number) => `R$ ${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip currency />} />
            <Area
              type="monotone"
              dataKey="receita"
              name="Receita"
              stroke="#F97316"
              strokeWidth={2}
              fill="url(#revenueGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border-default)]">
              <th className="pb-3 pr-4 text-xs font-medium text-[var(--text-secondary)]">Mês</th>
              <th className="pb-3 text-right text-xs font-medium text-[var(--text-secondary)]">Receita</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.month} className="border-b border-[var(--border-default)] last:border-0">
                <td className="py-3 pr-4 font-medium text-[var(--text-primary)]">{row.month}</td>
                <td className="py-3 text-right text-[var(--text-primary)]">
                  R$ {row.receita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StageConversionReport({ data }: { data: StageRow[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
            <XAxis dataKey="stage" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
            <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v: string) => <span style={{ color: "var(--text-secondary)" }}>{v}</span>} />
            <Bar dataKey="total" name="Total" fill="#A3A3A3" radius={[4, 4, 0, 0]} />
            <Bar dataKey="convertidos" name="Convertidos" fill="#F97316" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border-default)]">
              <th className="pb-3 pr-4 text-xs font-medium text-[var(--text-secondary)]">Etapa</th>
              <th className="pb-3 pr-4 text-right text-xs font-medium text-[var(--text-secondary)]">Total</th>
              <th className="pb-3 pr-4 text-right text-xs font-medium text-[var(--text-secondary)]">Convertidos</th>
              <th className="pb-3 text-right text-xs font-medium text-[var(--text-secondary)]">Taxa</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.stage} className="border-b border-[var(--border-default)] last:border-0">
                <td className="py-3 pr-4 font-medium text-[var(--text-primary)]">{row.stage}</td>
                <td className="py-3 pr-4 text-right text-[var(--text-primary)]">{row.total}</td>
                <td className="py-3 pr-4 text-right text-[var(--text-primary)]">{row.convertidos}</td>
                <td className="py-3 text-right">
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">
                    {row.taxa}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TeamPerformanceReport({ data }: { data: VendorRow[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
            <XAxis dataKey="name" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
            <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v: string) => <span style={{ color: "var(--text-secondary)" }}>{v}</span>} />
            <Bar dataKey="won" name="Ganhos" fill="#10B981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="lost" name="Perdidos" fill="#EF4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border-default)]">
              <th className="pb-3 pr-4 text-xs font-medium text-[var(--text-secondary)]">Membro</th>
              <th className="pb-3 pr-4 text-right text-xs font-medium text-[var(--text-secondary)]">Ganhos</th>
              <th className="pb-3 pr-4 text-right text-xs font-medium text-[var(--text-secondary)]">Perdidos</th>
              <th className="pb-3 pr-4 text-right text-xs font-medium text-[var(--text-secondary)]">Receita</th>
              <th className="pb-3 text-right text-xs font-medium text-[var(--text-secondary)]">Conversão</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.name} className="border-b border-[var(--border-default)] last:border-0">
                <td className="py-3 pr-4 font-medium text-[var(--text-primary)]">{row.name}</td>
                <td className="py-3 pr-4 text-right text-emerald-500">{row.won}</td>
                <td className="py-3 pr-4 text-right text-red-500">{row.lost}</td>
                <td className="py-3 pr-4 text-right text-[var(--text-primary)]">
                  R$ {row.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 text-right">
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">{row.conversao}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActivitiesReport({ data }: { data: ActivityRow[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
            <XAxis dataKey="name" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
            <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v: string) => <span style={{ color: "var(--text-secondary)" }}>{v}</span>} />
            <Bar dataKey="completed" name="Concluídas" fill="#10B981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="pending" name="Pendentes" fill="#F59E0B" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border-default)]">
              <th className="pb-3 pr-4 text-xs font-medium text-[var(--text-secondary)]">Vendedor</th>
              <th className="pb-3 pr-4 text-right text-xs font-medium text-[var(--text-secondary)]">Total</th>
              <th className="pb-3 pr-4 text-right text-xs font-medium text-[var(--text-secondary)]">Concluídas</th>
              <th className="pb-3 pr-4 text-right text-xs font-medium text-[var(--text-secondary)]">Ligações</th>
              <th className="pb-3 pr-4 text-right text-xs font-medium text-[var(--text-secondary)]">E-mails</th>
              <th className="pb-3 pr-4 text-right text-xs font-medium text-[var(--text-secondary)]">Reuniões</th>
              <th className="pb-3 text-right text-xs font-medium text-[var(--text-secondary)]">Follow-ups</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.name} className="border-b border-[var(--border-default)] last:border-0">
                <td className="py-3 pr-4 font-medium text-[var(--text-primary)]">{row.name}</td>
                <td className="py-3 pr-4 text-right text-[var(--text-primary)]">{row.total}</td>
                <td className="py-3 pr-4 text-right text-emerald-500">{row.completed}</td>
                <td className="py-3 pr-4 text-right text-[var(--text-primary)]">{row.calls}</td>
                <td className="py-3 pr-4 text-right text-[var(--text-primary)]">{row.emails}</td>
                <td className="py-3 pr-4 text-right text-[var(--text-primary)]">{row.meetings}</td>
                <td className="py-3 text-right text-[var(--text-primary)]">{row.followups}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RevenueForecastReport({ data }: { data: ForecastRow[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.slice(0, 15)} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
            <XAxis dataKey="name" tick={{ fill: "var(--text-secondary)", fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
            <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 12 }} tickFormatter={(v: number) => `R$ ${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip currency />} />
            <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v: string) => <span style={{ color: "var(--text-secondary)" }}>{v}</span>} />
            <Bar dataKey="value" name="Valor Total" fill="#A3A3A3" radius={[4, 4, 0, 0]} />
            <Bar dataKey="weighted" name="Valor Ponderado" fill="#F97316" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border-default)]">
              <th className="pb-3 pr-4 text-xs font-medium text-[var(--text-secondary)]">Deal</th>
              <th className="pb-3 pr-4 text-xs font-medium text-[var(--text-secondary)]">Etapa</th>
              <th className="pb-3 pr-4 text-right text-xs font-medium text-[var(--text-secondary)]">Valor</th>
              <th className="pb-3 pr-4 text-right text-xs font-medium text-[var(--text-secondary)]">Probabilidade</th>
              <th className="pb-3 text-right text-xs font-medium text-[var(--text-secondary)]">Forecast</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.name} className="border-b border-[var(--border-default)] last:border-0">
                <td className="py-3 pr-4 font-medium text-[var(--text-primary)]">{row.name}</td>
                <td className="py-3 pr-4 text-[var(--text-secondary)]">{row.stage}</td>
                <td className="py-3 pr-4 text-right text-[var(--text-primary)]">
                  R$ {row.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 pr-4 text-right">
                  <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-xs font-medium text-orange-500">{row.probability}%</span>
                </td>
                <td className="py-3 text-right font-medium text-orange-500">
                  R$ {row.weighted.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ResponseTimeReport({ data }: { data: ResponseTimeRow[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border-default)]">
              <th className="pb-3 pr-4 text-xs font-medium text-[var(--text-secondary)]">Deal</th>
              <th className="pb-3 pr-4 text-right text-xs font-medium text-[var(--text-secondary)]">Tempo (horas)</th>
              <th className="pb-3 text-right text-xs font-medium text-[var(--text-secondary)]">Faixa</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.name} className="border-b border-[var(--border-default)] last:border-0">
                <td className="py-3 pr-4 font-medium text-[var(--text-primary)]">{row.name}</td>
                <td className="py-3 pr-4 text-right text-[var(--text-primary)]">{row.hoursToRespond}h</td>
                <td className="py-3 text-right">
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    row.bucket === "< 1h" ? "bg-emerald-500/10 text-emerald-500"
                      : row.bucket === "1-4h" ? "bg-blue-500/10 text-blue-500"
                      : row.bucket === "4-24h" ? "bg-amber-500/10 text-amber-500"
                      : "bg-red-500/10 text-red-500",
                  )}>
                    {row.bucket}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Smart Query Engine ───────────────────────────────────────

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
    funnel: { stage: string; deals: number }[];
    wonLost: { month: string; ganhos: number; perdidos: number }[];
    lossReasons: { name: string; value: number }[];
  };
  recentDeals: { name: string; value: number; stage: string }[];
}

function processSmartQuery(question: string, data: DashboardData): string {
  const q = question.toLowerCase();
  const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  if (q.includes("receita") || q.includes("faturamento") || q.includes("revenue")) {
    const total = data.stats.revenue;
    const months = data.charts.revenue;
    const best = months.length > 0
      ? months.reduce((a, b) => (b.receita > a.receita ? b : a), months[0])
      : null;
    let msg = `Sua receita no período atual é de R$ ${fmt(total)}.`;
    if (data.stats.revenueChange !== null) {
      msg += ` Variação de ${data.stats.revenueChange > 0 ? "+" : ""}${data.stats.revenueChange}% vs período anterior.`;
    }
    if (best) msg += ` Melhor mês: ${best.month} com R$ ${fmt(best.receita)}.`;
    return msg;
  }

  if (q.includes("ticket") || q.includes("médio") || q.includes("medio")) {
    return `Ticket médio atual: R$ ${fmt(data.stats.averageTicket)}.` +
      (data.stats.averageTicketChange !== null
        ? ` Variação de ${data.stats.averageTicketChange > 0 ? "+" : ""}${data.stats.averageTicketChange}% vs período anterior.`
        : "");
  }

  if (q.includes("deal") || q.includes("negóci") || q.includes("negoci") || q.includes("fechei") || q.includes("ganho")) {
    const wonLost = data.charts.wonLost;
    const totalWon = wonLost.reduce((s, m) => s + m.ganhos, 0);
    const totalLost = wonLost.reduce((s, m) => s + m.perdidos, 0);
    return `Nos últimos 6 meses: ${totalWon} deals ganhos e ${totalLost} perdidos. ` +
      `Taxa de conversão atual: ${data.stats.conversionRate}%. ` +
      `Total de deals no período: ${data.stats.totalDeals}. ` +
      `Deals ativos no pipeline: ${data.stats.dealsInPipeline}.`;
  }

  if (q.includes("vendedor") || q.includes("vendeu mais") || q.includes("melhor vendedor") || q.includes("ranking")) {
    return "Para ver o ranking completo de vendedores, gere o relatório 'Performance por Vendedor' acima. " +
      `Atualmente há ${data.stats.dealsInPipeline} deals ativos no pipeline com taxa de conversão de ${data.stats.conversionRate}%.`;
  }

  if (q.includes("perda") || q.includes("perdi") || q.includes("perdido") || q.includes("motivo")) {
    const reasons = data.charts.lossReasons;
    if (reasons.length === 0) return "Nenhum motivo de perda registrado no período.";
    const top = reasons.slice(0, 3).map((r) => `${r.name} (${r.value})`).join(", ");
    return `Principais motivos de perda: ${top}. Gere o relatório 'Motivos de Perda' para detalhes completos.`;
  }

  if (q.includes("pipeline") || q.includes("funil") || q.includes("etapa")) {
    const funnel = data.charts.funnel;
    if (funnel.length === 0) return "Nenhum dado de pipeline encontrado.";
    const stages = funnel.map((s) => `${s.stage}: ${s.deals}`).join(", ");
    return `Distribuição do funil — ${stages}. Total de ${data.stats.dealsInPipeline} deals ativos.`;
  }

  if (q.includes("tarefa") || q.includes("task") || q.includes("conclu")) {
    return `Você concluiu ${data.stats.completedTasks} tarefas no período.` +
      (data.stats.completedTasksChange !== null
        ? ` Variação de ${data.stats.completedTasksChange > 0 ? "+" : ""}${data.stats.completedTasksChange}% vs anterior.`
        : "");
  }

  // Generic fallback
  return `Resumo atual: Receita R$ ${fmt(data.stats.revenue)}, ` +
    `${data.stats.totalDeals} deals no período, ${data.stats.dealsInPipeline} ativos no pipeline, ` +
    `conversão ${data.stats.conversionRate}%, ticket médio R$ ${fmt(data.stats.averageTicket)}, ` +
    `${data.stats.completedTasks} tarefas concluídas. Pergunte sobre receita, deals, vendedores, perdas ou pipeline.`;
}

// ─── Page ─────────────────────────────────────────────────────

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [reports, setReports] = useState<Record<string, ReportState>>({});

  // Smart query state
  const [queryInput, setQueryInput] = useState("");
  const [queryAnswer, setQueryAnswer] = useState<string | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);

  const apiPeriod = period === "today" || period === "week" || period === "custom" ? "month" : period;

  const fetchReport = useCallback(async (apiType: ReportType, title: string) => {
    if (expandedReport === title) {
      setExpandedReport(null);
      return;
    }

    setExpandedReport(title);

    // Already loaded
    if (reports[title]?.data) return;

    setReports((prev) => ({ ...prev, [title]: { loading: true, data: null, error: null } }));

    try {
      const res = await fetch(`/api/reports?type=${apiType}&period=${apiPeriod}`);
      const json = await res.json();

      if (!res.ok) {
        setReports((prev) => ({ ...prev, [title]: { loading: false, data: null, error: json.error || "Erro ao carregar" } }));
        return;
      }

      setReports((prev) => ({
        ...prev,
        [title]: {
          loading: false,
          data: json.data,
          error: null,
          message: json.message,
        },
      }));
    } catch {
      setReports((prev) => ({ ...prev, [title]: { loading: false, data: null, error: "Erro de conexão" } }));
    }
  }, [expandedReport, reports, apiPeriod]);

  const handleSmartQuery = useCallback(async () => {
    if (!queryInput.trim()) return;
    setQueryLoading(true);
    setQueryAnswer(null);

    try {
      const res = await fetch(`/api/dashboard?period=${apiPeriod}`);
      const data = await res.json() as DashboardData;
      const answer = processSmartQuery(queryInput, data);
      setQueryAnswer(answer);
    } catch {
      setQueryAnswer("Erro ao buscar dados. Tente novamente.");
    } finally {
      setQueryLoading(false);
    }
  }, [queryInput, apiPeriod]);

  const handleExportCSV = useCallback(() => {
    if (!expandedReport || !reports[expandedReport]?.data) return;
    const data = reports[expandedReport].data;
    if (!data || data.length === 0) return;
    exportCSV(data, expandedReport.replace(/ /g, "_").toLowerCase());
  }, [expandedReport, reports]);

  const renderExpandedReport = (apiType: ReportType, state: ReportState) => {
    if (state.loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
          <span className="ml-2 text-sm text-[var(--text-secondary)]">Carregando dados...</span>
        </div>
      );
    }

    if (state.error) {
      return (
        <div className="py-8 text-center text-sm text-red-500">{state.error}</div>
      );
    }

    if (state.message || !state.data || state.data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10">
            <BarChart3 className="h-7 w-7 text-orange-500" />
          </div>
          <h4 className="text-sm font-semibold text-[var(--text-primary)]">
            {state.message || "Dados insuficientes para este relatório"}
          </h4>
          <p className="mt-1 max-w-xs text-xs text-[var(--text-muted)]">
            Crie deals e tarefas para gerar relatórios. Quanto mais dados, mais completas serão as análises.
          </p>
          <a
            href="/pipeline"
            className="mt-4 inline-flex items-center gap-1 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
          >
            Ir para Pipeline
          </a>
        </div>
      );
    }

    switch (apiType) {
      case "vendor-performance":
        return <VendorPerformanceReport data={state.data as VendorRow[]} />;
      case "origin-conversion":
        return <OriginConversionReport data={state.data as OriginRow[]} />;
      case "loss-reasons":
        return <LossReasonsReport data={state.data as LossRow[]} />;
      case "stage-conversion":
        return <StageConversionReport data={state.data as StageRow[]} />;
      case "revenue-period":
        return <RevenuePeriodReport data={state.data as RevenueRow[]} />;
      case "team-performance":
        return <TeamPerformanceReport data={state.data as VendorRow[]} />;
      case "activities":
        return <ActivitiesReport data={state.data as ActivityRow[]} />;
      case "revenue-forecast":
        return <RevenueForecastReport data={state.data as ForecastRow[]} />;
      case "response-time":
        return <ResponseTimeReport data={state.data as ResponseTimeRow[]} />;
      default:
        return (
          <div className="py-8 text-center text-sm text-[var(--text-secondary)]">
            Dados insuficientes para gerar este relatório. Adicione mais dados ao sistema.
          </div>
        );
    }
  };

  return (
    <PageContainer title="Relatórios" description="Análises detalhadas e relatórios do desempenho comercial">
      {/* Print-optimized styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <div className="no-print mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-1">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => {
                  setPeriod(p.value);
                  setReports({});
                  setExpandedReport(null);
                }}
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
          <Button
            variant="secondary"
            size="sm"
            icon={<FileSpreadsheet size={14} />}
            onClick={handleExportCSV}
            disabled={!expandedReport || !reports[expandedReport]?.data}
          >
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Smart Query Section */}
      <div className="no-print mb-6">
        <Card hoverable={false} className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Search size={16} className="text-orange-500" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Consulta Inteligente</h3>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSmartQuery()}
              placeholder="Pergunte sobre seus dados... Ex: 'Qual minha receita?', 'Quantos deals fechei?'"
              className="flex-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-orange-500 focus:outline-none"
            />
            <Button
              variant="primary"
              size="sm"
              icon={queryLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              onClick={handleSmartQuery}
              disabled={queryLoading || !queryInput.trim()}
            >
              Consultar
            </Button>
          </div>
          <AnimatePresence>
            {queryAnswer && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-lg border border-orange-500/20 bg-orange-500/5 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm leading-relaxed text-[var(--text-primary)]">{queryAnswer}</p>
                  <button onClick={() => setQueryAnswer(null)} className="mt-0.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                    <X size={14} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>

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
            <div key={report.title}>
              <ReportCard
                icon={report.icon}
                title={report.title}
                description={report.description}
                color={report.color}
                onGenerate={() => fetchReport(report.apiType, report.title)}
              />

              {/* Expanded content */}
              <AnimatePresence>
                {expandedReport === report.title && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="print-area"
                  >
                    <Card hoverable={false} className="mt-2 flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                          {report.title}
                        </h3>
                        <div className="no-print flex items-center gap-2">
                          {reports[report.title]?.data && reports[report.title].data!.length > 0 && (
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<Download size={14} />}
                              onClick={() => {
                                const data = reports[report.title]?.data;
                                if (data) exportCSV(data, report.title.replace(/ /g, "_").toLowerCase());
                              }}
                            >
                              CSV
                            </Button>
                          )}
                          <button
                            onClick={() => setExpandedReport(null)}
                            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                          >
                            <ChevronDown size={16} className="rotate-180" />
                          </button>
                        </div>
                      </div>
                      {reports[report.title] && renderExpandedReport(report.apiType, reports[report.title])}
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </motion.div>
      </div>
    </PageContainer>
  );
}
