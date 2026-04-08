"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Monitor,
  Trophy,
  ArrowUp,
  ArrowDown,
  Minus,
  Medal,
  X,
  Zap,
  Target,
  Clock,
  TrendingUp,
  Users,
} from "lucide-react";
import { PageContainer } from "@/components/layout";
import { Card, Button, Avatar } from "@/components/ui";
import { staggerContainer, staggerChild } from "@/lib/motion";
import { cn } from "@/lib/cn";

// ─── Types ────────────────────────────────────────────────────

type Period = "month" | "quarter" | "year";
type Scope = "general" | "team";

interface Seller {
  id: number;
  name: string;
  avatar?: string;
  revenue: number;
  dealsWon: number;
  conversionRate: number;
  tasksCompleted: number;
  avgResponseTime: string;
  positionChange: "up" | "down" | "same";
}

// ─── Period Options ───────────────────────────────────────────

const periods: { value: Period; label: string }[] = [
  { value: "month", label: "Este Mês" },
  { value: "quarter", label: "Este Trimestre" },
  { value: "year", label: "Este Ano" },
];

// ─── Mock Data ────────────────────────────────────────────────

const sellers: Seller[] = [
  { id: 1, name: "Ana Carolina Silva", revenue: 342500, dealsWon: 28, conversionRate: 38.2, tasksCompleted: 156, avgResponseTime: "1h 12min", positionChange: "up" },
  { id: 2, name: "Carlos Eduardo Souza", revenue: 298000, dealsWon: 24, conversionRate: 34.5, tasksCompleted: 142, avgResponseTime: "1h 35min", positionChange: "same" },
  { id: 3, name: "Mariana Lima Santos", revenue: 275800, dealsWon: 22, conversionRate: 31.8, tasksCompleted: 138, avgResponseTime: "2h 05min", positionChange: "up" },
  { id: 4, name: "Pedro Henrique Oliveira", revenue: 248300, dealsWon: 19, conversionRate: 29.4, tasksCompleted: 125, avgResponseTime: "1h 48min", positionChange: "down" },
  { id: 5, name: "Juliana Costa Ferreira", revenue: 221000, dealsWon: 17, conversionRate: 27.1, tasksCompleted: 118, avgResponseTime: "2h 22min", positionChange: "up" },
  { id: 6, name: "Rafael Mendes Almeida", revenue: 198500, dealsWon: 15, conversionRate: 24.8, tasksCompleted: 110, avgResponseTime: "2h 40min", positionChange: "down" },
  { id: 7, name: "Beatriz Rocha Nunes", revenue: 178200, dealsWon: 14, conversionRate: 22.5, tasksCompleted: 102, avgResponseTime: "1h 55min", positionChange: "same" },
  { id: 8, name: "Lucas Barbosa Pinto", revenue: 156800, dealsWon: 12, conversionRate: 20.3, tasksCompleted: 95, avgResponseTime: "3h 10min", positionChange: "down" },
  { id: 9, name: "Fernanda Dias Moreira", revenue: 142500, dealsWon: 11, conversionRate: 18.7, tasksCompleted: 88, avgResponseTime: "2h 50min", positionChange: "up" },
  { id: 10, name: "Thiago Nascimento Reis", revenue: 128000, dealsWon: 9, conversionRate: 16.2, tasksCompleted: 76, avgResponseTime: "3h 25min", positionChange: "same" },
];

// ─── Podium Card ──────────────────────────────────────────────

function PodiumCard({
  seller,
  position,
  tvMode,
}: {
  seller: Seller;
  position: 1 | 2 | 3;
  tvMode: boolean;
}) {
  const medalColors = {
    1: { bg: "bg-orange-500/10", border: "border-orange-500/50", text: "text-orange-500", shadow: "shadow-[0_0_30px_rgba(249,115,22,0.2)]" },
    2: { bg: "bg-neutral-400/10", border: "border-neutral-400/30", text: "text-neutral-400", shadow: "" },
    3: { bg: "bg-amber-700/10", border: "border-amber-700/30", text: "text-amber-600", shadow: "" },
  } as const;

  const colors = medalColors[position];
  const isFirst = position === 1;

  return (
    <motion.div
      variants={staggerChild}
      className={cn(
        "flex flex-col items-center rounded-xl border p-6 text-center transition-colors",
        "bg-[var(--bg-surface)]",
        colors.border,
        isFirst && colors.shadow,
        isFirst ? "order-2 lg:scale-105" : position === 2 ? "order-1" : "order-3",
        tvMode && "p-8",
      )}
    >
      {/* Medal */}
      <div className={cn(
        "mb-4 flex h-10 w-10 items-center justify-center rounded-full",
        colors.bg,
        tvMode && "h-14 w-14",
      )}>
        <Medal className={cn(colors.text, tvMode ? "h-7 w-7" : "h-5 w-5")} />
      </div>

      {/* Position */}
      <span className={cn(
        "mb-2 text-3xl font-bold",
        colors.text,
        tvMode && "text-5xl",
      )}>
        {position}º
      </span>

      {/* Avatar */}
      <Avatar
        name={seller.name}
        size="lg"
        className={cn("mb-3", tvMode && "!h-16 !w-16 !text-lg")}
      />

      {/* Name */}
      <h3 className={cn(
        "mb-1 font-semibold text-[var(--text-primary)]",
        tvMode ? "text-xl" : "text-sm",
      )}>
        {seller.name}
      </h3>

      {/* Stats */}
      <p className={cn(
        "font-bold text-orange-500",
        tvMode ? "text-2xl" : "text-lg",
      )}>
        R$ {seller.revenue.toLocaleString("pt-BR")}
      </p>
      <p className={cn(
        "text-[var(--text-secondary)]",
        tvMode ? "text-base" : "text-xs",
      )}>
        {seller.dealsWon} deals ganhos
      </p>
    </motion.div>
  );
}

// ─── Position Change Icon ─────────────────────────────────────

function PositionChangeIcon({ change }: { change: Seller["positionChange"] }) {
  if (change === "up") {
    return <ArrowUp className="h-4 w-4 text-emerald-500" />;
  }
  if (change === "down") {
    return <ArrowDown className="h-4 w-4 text-red-500" />;
  }
  return <Minus className="h-4 w-4 text-neutral-500" />;
}

// ─── Ranking Row Backgrounds ──────────────────────────────────

function getRowBg(index: number): string {
  if (index === 0) return "bg-orange-500/5";
  if (index === 1) return "bg-neutral-400/5";
  if (index === 2) return "bg-amber-700/5";
  return "";
}

// ─── Metric Card ──────────────────────────────────────────────

function MetricCard({
  icon,
  title,
  value,
  sellerName,
  tvMode,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  sellerName: string;
  tvMode: boolean;
}) {
  return (
    <motion.div variants={staggerChild}>
      <Card hoverable={false} className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
            <Trophy className={cn("text-orange-500", tvMode ? "h-5 w-5" : "h-4 w-4")} />
          </div>
          <span className={cn(
            "font-medium text-[var(--text-secondary)]",
            tvMode ? "text-base" : "text-xs",
          )}>
            {title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {icon}
          <span className={cn(
            "font-bold text-[var(--text-primary)]",
            tvMode ? "text-2xl" : "text-lg",
          )}>
            {value}
          </span>
        </div>
        <p className={cn(
          "text-[var(--text-secondary)]",
          tvMode ? "text-sm" : "text-xs",
        )}>
          {sellerName}
        </p>
      </Card>
    </motion.div>
  );
}

// ─── Live Badge ───────────────────────────────────────────────

function LiveBadge() {
  return (
    <motion.div
      animate={{ opacity: [1, 0.3, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1"
    >
      <div className="h-2 w-2 rounded-full bg-red-500" />
      <span className="text-xs font-semibold text-red-500">Ao Vivo</span>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────

export default function RankingPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [scope, setScope] = useState<Scope>("general");
  const [tvMode, setTvMode] = useState(false);

  // Exit TV mode on ESC
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setTvMode(false);
  }, []);

  useEffect(() => {
    if (tvMode) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [tvMode, handleKeyDown]);

  // Top 3 for podium (reorder: 2nd, 1st, 3rd)
  const top3 = sellers.slice(0, 3);

  // Metric highlights
  const bestRevenue = sellers[0];
  const mostDeals = [...sellers].sort((a, b) => b.dealsWon - a.dealsWon)[0];
  const fastestResponse = [...sellers].sort((a, b) => {
    const parseTime = (t: string) => {
      const hours = parseInt(t.match(/(\d+)h/)?.[1] ?? "0");
      const mins = parseInt(t.match(/(\d+)min/)?.[1] ?? "0");
      return hours * 60 + mins;
    };
    return parseTime(a.avgResponseTime) - parseTime(b.avgResponseTime);
  })[0];
  const bestConversion = [...sellers].sort((a, b) => b.conversionRate - a.conversionRate)[0];

  // ─── TV Mode Overlay ─────────────────────────────────────────
  if (tvMode) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 overflow-auto bg-[var(--bg-base)]"
          onClick={() => setTvMode(false)}
        >
          <div
            className="mx-auto max-w-7xl px-8 py-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* TV Header */}
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-4xl font-bold text-[var(--text-primary)]">
                  Ranking
                </h1>
                <LiveBadge />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-1">
                  {periods.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setPeriod(p.value)}
                      className={cn(
                        "rounded-md px-4 py-2 text-sm font-medium transition-colors",
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
                  onClick={() => setTvMode(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* TV Podium */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="mb-8 grid grid-cols-3 gap-6"
            >
              <PodiumCard seller={top3[1]} position={2} tvMode />
              <PodiumCard seller={top3[0]} position={1} tvMode />
              <PodiumCard seller={top3[2]} position={3} tvMode />
            </motion.div>

            {/* TV Table */}
            <Card hoverable={false} className="mb-8">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[var(--border-default)]">
                      <th className="pb-4 pr-4 text-sm font-medium text-[var(--text-secondary)]">#</th>
                      <th className="pb-4 pr-4 text-sm font-medium text-[var(--text-secondary)]">Vendedor</th>
                      <th className="pb-4 pr-4 text-right text-sm font-medium text-[var(--text-secondary)]">Deals</th>
                      <th className="pb-4 pr-4 text-right text-sm font-medium text-[var(--text-secondary)]">Receita</th>
                      <th className="pb-4 pr-4 text-right text-sm font-medium text-[var(--text-secondary)]">Conversão</th>
                      <th className="pb-4 pr-4 text-right text-sm font-medium text-[var(--text-secondary)]">Tarefas</th>
                      <th className="pb-4 text-right text-sm font-medium text-[var(--text-secondary)]">Tempo Resp.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sellers.map((seller, i) => (
                      <tr
                        key={seller.id}
                        className={cn(
                          "border-b border-[var(--border-default)] last:border-0",
                          getRowBg(i),
                        )}
                      >
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-2">
                            <PositionChangeIcon change={seller.positionChange} />
                            <span className="text-base font-bold text-[var(--text-primary)]">{i + 1}</span>
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={seller.name} size="md" />
                            <span className="text-base font-medium text-[var(--text-primary)]">{seller.name}</span>
                          </div>
                        </td>
                        <td className="py-4 pr-4 text-right text-base text-[var(--text-primary)]">{seller.dealsWon}</td>
                        <td className="py-4 pr-4 text-right text-base font-medium text-[var(--text-primary)]">
                          R$ {seller.revenue.toLocaleString("pt-BR")}
                        </td>
                        <td className="py-4 pr-4 text-right">
                          <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-sm font-medium text-emerald-500">
                            {seller.conversionRate}%
                          </span>
                        </td>
                        <td className="py-4 pr-4 text-right text-base text-[var(--text-primary)]">{seller.tasksCompleted}</td>
                        <td className="py-4 text-right text-base text-[var(--text-secondary)]">{seller.avgResponseTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* TV Metrics */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-4 gap-6"
            >
              <MetricCard
                icon={<Zap className="h-5 w-5 text-orange-500" />}
                title="Maior Receita"
                value={`R$ ${bestRevenue.revenue.toLocaleString("pt-BR")}`}
                sellerName={bestRevenue.name}
                tvMode
              />
              <MetricCard
                icon={<Target className="h-5 w-5 text-emerald-500" />}
                title="Mais Deals Fechados"
                value={`${mostDeals.dealsWon} deals`}
                sellerName={mostDeals.name}
                tvMode
              />
              <MetricCard
                icon={<Clock className="h-5 w-5 text-blue-500" />}
                title="Menor Tempo de Resposta"
                value={fastestResponse.avgResponseTime}
                sellerName={fastestResponse.name}
                tvMode
              />
              <MetricCard
                icon={<TrendingUp className="h-5 w-5 text-purple-500" />}
                title="Maior Taxa de Conversão"
                value={`${bestConversion.conversionRate}%`}
                sellerName={bestConversion.name}
                tvMode
              />
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // ─── Normal Mode ──────────────────────────────────────────────

  return (
    <PageContainer title="Ranking" description="Acompanhe o desempenho e a posição dos vendedores">
      {/* Header Controls */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {/* Period Selector */}
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

          {/* Scope Toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-1">
            <button
              onClick={() => setScope("general")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                scope === "general"
                  ? "bg-orange-500 text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
              )}
            >
              <Users className="h-3.5 w-3.5" />
              Geral
            </button>
            <button
              onClick={() => setScope("team")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                scope === "team"
                  ? "bg-orange-500 text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
              )}
            >
              <Users className="h-3.5 w-3.5" />
              Minha Equipe
            </button>
          </div>
        </div>

        {/* TV Mode Button */}
        <Button
          variant="secondary"
          size="sm"
          icon={<Monitor size={14} />}
          onClick={() => setTvMode(true)}
        >
          Modo TV
        </Button>
      </div>

      {/* Podium Top 3 */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3"
      >
        <PodiumCard seller={top3[1]} position={2} tvMode={false} />
        <PodiumCard seller={top3[0]} position={1} tvMode={false} />
        <PodiumCard seller={top3[2]} position={3} tvMode={false} />
      </motion.div>

      {/* Full Ranking Table */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="mb-6"
      >
        <motion.div variants={staggerChild}>
          <Card hoverable={false} className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Ranking Completo
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-default)]">
                    <th className="pb-3 pr-4 text-xs font-medium text-[var(--text-secondary)]">#</th>
                    <th className="pb-3 pr-4 text-xs font-medium text-[var(--text-secondary)]">Vendedor</th>
                    <th className="pb-3 pr-4 text-right text-xs font-medium text-[var(--text-secondary)]">Deals Ganhos</th>
                    <th className="pb-3 pr-4 text-right text-xs font-medium text-[var(--text-secondary)]">Receita</th>
                    <th className="pb-3 pr-4 text-right text-xs font-medium text-[var(--text-secondary)]">Conversão</th>
                    <th className="pb-3 pr-4 text-right text-xs font-medium text-[var(--text-secondary)]">Tarefas</th>
                    <th className="pb-3 text-right text-xs font-medium text-[var(--text-secondary)]">Tempo Resp.</th>
                  </tr>
                </thead>
                <tbody>
                  {sellers.map((seller, i) => (
                    <tr
                      key={seller.id}
                      className={cn(
                        "border-b border-[var(--border-default)] last:border-0",
                        getRowBg(i),
                      )}
                    >
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <PositionChangeIcon change={seller.positionChange} />
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
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={seller.name} size="sm" />
                          <span className="font-medium text-[var(--text-primary)]">
                            {seller.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-right text-[var(--text-primary)]">
                        {seller.dealsWon}
                      </td>
                      <td className="py-3 pr-4 text-right font-medium text-[var(--text-primary)]">
                        R$ {seller.revenue.toLocaleString("pt-BR")}
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">
                          {seller.conversionRate}%
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right text-[var(--text-primary)]">
                        {seller.tasksCompleted}
                      </td>
                      <td className="py-3 text-right text-[var(--text-secondary)]">
                        {seller.avgResponseTime}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Comparative Metrics */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <MetricCard
          icon={<Zap className="h-5 w-5 text-orange-500" />}
          title="Maior Receita"
          value={`R$ ${bestRevenue.revenue.toLocaleString("pt-BR")}`}
          sellerName={bestRevenue.name}
          tvMode={false}
        />
        <MetricCard
          icon={<Target className="h-5 w-5 text-emerald-500" />}
          title="Mais Deals Fechados"
          value={`${mostDeals.dealsWon} deals`}
          sellerName={mostDeals.name}
          tvMode={false}
        />
        <MetricCard
          icon={<Clock className="h-5 w-5 text-blue-500" />}
          title="Menor Tempo de Resposta"
          value={fastestResponse.avgResponseTime}
          sellerName={fastestResponse.name}
          tvMode={false}
        />
        <MetricCard
          icon={<TrendingUp className="h-5 w-5 text-purple-500" />}
          title="Maior Taxa de Conversão"
          value={`${bestConversion.conversionRate}%`}
          sellerName={bestConversion.name}
          tvMode={false}
        />
      </motion.div>
    </PageContainer>
  );
}
