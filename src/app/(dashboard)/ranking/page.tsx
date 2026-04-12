"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Monitor,
  Trophy,
  Medal,
  X,
  Zap,
  Target,
  TrendingUp,
  Users,
  Loader2,
  BarChart3,
} from "lucide-react";
import { PageContainer } from "@/components/layout";
import { Card, Button, Avatar } from "@/components/ui";
import { staggerContainer, staggerChild } from "@/lib/motion";
import { cn } from "@/lib/cn";

// ─── Types ────────────────────────────────────────────────────

type Period = "month" | "quarter" | "year";
type Scope = "general" | "team";

interface Seller {
  position: number;
  id: string;
  name: string;
  avatar: string | null;
  revenue: number;
  dealsWon: number;
  dealsLost: number;
  conversionRate: number;
  tasksCompleted: number;
}

// ─── Period Options ───────────────────────────────────────────

const periods: { value: Period; label: string }[] = [
  { value: "month", label: "Este Mês" },
  { value: "quarter", label: "Este Trimestre" },
  { value: "year", label: "Este Ano" },
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

// ─── Empty State ──────────────────────────────────────────────

function EmptyState({ tvMode }: { tvMode: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10">
        <BarChart3 className="h-8 w-8 text-orange-500" />
      </div>
      <h3 className={cn(
        "font-semibold text-[var(--text-primary)]",
        tvMode ? "text-2xl" : "text-lg",
      )}>
        Nenhum dado de ranking
      </h3>
      <p className={cn(
        "max-w-md text-center text-[var(--text-secondary)]",
        tvMode ? "text-base" : "text-sm",
      )}>
        Adicione vendedores e feche deals para ver o ranking
      </p>
    </div>
  );
}

// ─── Loading State ────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      <p className="text-sm text-[var(--text-secondary)]">Carregando ranking...</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────

export default function RankingPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [scope, setScope] = useState<Scope>("general");
  const [tvMode, setTvMode] = useState(false);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch ranking data
  const fetchRanking = useCallback(async (p: Period, s: Scope) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ranking?period=${p}&scope=${s === "team" ? "team" : "all"}`);
      if (res.ok) {
        const data = await res.json();
        setSellers(data);
      } else {
        setSellers([]);
      }
    } catch {
      setSellers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRanking(period, scope);
  }, [period, scope, fetchRanking]);

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

  // Period change handler
  const handlePeriodChange = (p: Period) => {
    setPeriod(p);
  };

  // Top 3 for podium
  const top3 = sellers.slice(0, 3);

  // Metric highlights
  const bestRevenue = sellers.length > 0 ? sellers[0] : null;
  const mostDeals = sellers.length > 0
    ? [...sellers].sort((a, b) => b.dealsWon - a.dealsWon)[0]
    : null;
  const bestConversion = sellers.length > 0
    ? [...sellers].sort((a, b) => b.conversionRate - a.conversionRate)[0]
    : null;
  const mostTasks = sellers.length > 0
    ? [...sellers].sort((a, b) => b.tasksCompleted - a.tasksCompleted)[0]
    : null;

  // ─── Shared Content ──────────────────────────────────────────

  const renderPodium = (isTv: boolean) => {
    if (top3.length === 0) return null;

    // Handle fewer than 3 sellers
    if (top3.length === 1) {
      return (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mb-6 flex justify-center"
        >
          <div className="w-full max-w-sm">
            <PodiumCard seller={top3[0]} position={1} tvMode={isTv} />
          </div>
        </motion.div>
      );
    }

    if (top3.length === 2) {
      return (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <PodiumCard seller={top3[0]} position={1} tvMode={isTv} />
          <PodiumCard seller={top3[1]} position={2} tvMode={isTv} />
        </motion.div>
      );
    }

    return (
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className={cn("mb-6 grid grid-cols-1 gap-4 md:grid-cols-3", isTv && "mb-8 gap-6")}
      >
        <PodiumCard seller={top3[1]} position={2} tvMode={isTv} />
        <PodiumCard seller={top3[0]} position={1} tvMode={isTv} />
        <PodiumCard seller={top3[2]} position={3} tvMode={isTv} />
      </motion.div>
    );
  };

  const renderTable = (isTv: boolean) => {
    if (sellers.length === 0) return null;

    return (
      <Card hoverable={false} className={cn("flex flex-col gap-4", isTv && "mb-8")}>
        {!isTv && (
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Ranking Completo
          </h3>
        )}
        <div className="overflow-x-auto">
          <table className={cn("w-full text-left", isTv ? "text-base" : "text-sm")}>
            <thead>
              <tr className="border-b border-[var(--border-default)]">
                <th className={cn("pb-3 pr-4 font-medium text-[var(--text-secondary)]", isTv ? "text-sm" : "text-xs")}>#</th>
                <th className={cn("pb-3 pr-4 font-medium text-[var(--text-secondary)]", isTv ? "text-sm" : "text-xs")}>Vendedor</th>
                <th className={cn("pb-3 pr-4 text-right font-medium text-[var(--text-secondary)]", isTv ? "text-sm" : "text-xs")}>Deals Ganhos</th>
                <th className={cn("pb-3 pr-4 text-right font-medium text-[var(--text-secondary)]", isTv ? "text-sm" : "text-xs")}>Receita</th>
                <th className={cn("pb-3 pr-4 text-right font-medium text-[var(--text-secondary)]", isTv ? "text-sm" : "text-xs")}>Conversão</th>
                <th className={cn("pb-3 text-right font-medium text-[var(--text-secondary)]", isTv ? "text-sm" : "text-xs")}>Tarefas</th>
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
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={seller.name} size={isTv ? "md" : "sm"} />
                      <span className={cn("font-medium text-[var(--text-primary)]", isTv && "text-base")}>
                        {seller.name}
                      </span>
                    </div>
                  </td>
                  <td className={cn("py-3 pr-4 text-right text-[var(--text-primary)]", isTv && "text-base")}>
                    {seller.dealsWon}
                  </td>
                  <td className={cn("py-3 pr-4 text-right font-medium text-[var(--text-primary)]", isTv && "text-base")}>
                    R$ {seller.revenue.toLocaleString("pt-BR")}
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">
                      {seller.conversionRate}%
                    </span>
                  </td>
                  <td className={cn("py-3 text-right text-[var(--text-primary)]", isTv && "text-base")}>
                    {seller.tasksCompleted}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    );
  };

  const renderMetrics = (isTv: boolean) => {
    if (!bestRevenue) return null;

    return (
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className={cn(
          "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4",
          isTv && "gap-6",
        )}
      >
        <MetricCard
          icon={<Zap className="h-5 w-5 text-orange-500" />}
          title="Maior Receita"
          value={`R$ ${bestRevenue.revenue.toLocaleString("pt-BR")}`}
          sellerName={bestRevenue.name}
          tvMode={isTv}
        />
        {mostDeals && (
          <MetricCard
            icon={<Target className="h-5 w-5 text-emerald-500" />}
            title="Mais Deals Fechados"
            value={`${mostDeals.dealsWon} deals`}
            sellerName={mostDeals.name}
            tvMode={isTv}
          />
        )}
        {mostTasks && (
          <MetricCard
            icon={<BarChart3 className="h-5 w-5 text-blue-500" />}
            title="Mais Tarefas Concluídas"
            value={`${mostTasks.tasksCompleted} tarefas`}
            sellerName={mostTasks.name}
            tvMode={isTv}
          />
        )}
        {bestConversion && (
          <MetricCard
            icon={<TrendingUp className="h-5 w-5 text-purple-500" />}
            title="Maior Taxa de Conversão"
            value={`${bestConversion.conversionRate}%`}
            sellerName={bestConversion.name}
            tvMode={isTv}
          />
        )}
      </motion.div>
    );
  };

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
                      onClick={() => handlePeriodChange(p.value)}
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

            {loading ? (
              <LoadingState />
            ) : sellers.length === 0 ? (
              <EmptyState tvMode />
            ) : (
              <>
                {renderPodium(true)}
                {renderTable(true)}
                {renderMetrics(true)}
              </>
            )}
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

      {loading ? (
        <LoadingState />
      ) : sellers.length === 0 ? (
        <EmptyState tvMode={false} />
      ) : (
        <>
          {/* Podium Top 3 */}
          {renderPodium(false)}

          {/* Full Ranking Table */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="mb-6"
          >
            <motion.div variants={staggerChild}>
              {renderTable(false)}
            </motion.div>
          </motion.div>

          {/* Comparative Metrics */}
          {renderMetrics(false)}
        </>
      )}
    </PageContainer>
  );
}
