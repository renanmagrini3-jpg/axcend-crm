"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowUp, ArrowDown } from "lucide-react";
import { Card } from "@/components/ui";
import { staggerChild } from "@/lib/motion";
import { cn } from "@/lib/cn";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  change?: number;
  color: "green" | "orange" | "blue" | "yellow";
}

const colorMap: Record<StatCardProps["color"], { bg: string; text: string }> = {
  green: { bg: "bg-emerald-500/10", text: "text-emerald-500" },
  orange: { bg: "bg-orange-500/10", text: "text-orange-500" },
  blue: { bg: "bg-blue-500/10", text: "text-blue-500" },
  yellow: { bg: "bg-amber-500/10", text: "text-amber-500" },
};

function useCountUp(target: number, decimals: number, duration = 1200) {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(eased * target);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return current.toFixed(decimals);
}

function formatNumber(value: string, prefix: string, suffix: string): string {
  const num = parseFloat(value);
  if (prefix === "R$ ") {
    return `${prefix}${num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (Number.isInteger(num) && !value.includes(".")) {
    return `${prefix}${num.toLocaleString("pt-BR")}${suffix}`;
  }
  return `${prefix}${num.toLocaleString("pt-BR", { minimumFractionDigits: parseFloat(value) === num ? (value.split(".")[1]?.length ?? 0) : 0 })}${suffix}`;
}

function StatCard({
  icon,
  label,
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  change,
  color,
}: StatCardProps) {
  const counted = useCountUp(value, decimals);
  const colors = colorMap[color];
  const isPositive = change !== undefined && change >= 0;

  return (
    <Card>
      <motion.div variants={staggerChild} className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              colors.bg,
              colors.text,
            )}
          >
            {icon}
          </div>
          {change !== undefined && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                isPositive
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-red-500/10 text-red-500",
              )}
            >
              {isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
              {isPositive ? "+" : ""}
              {change}%
            </span>
          )}
        </div>
        <p className="text-3xl font-bold text-[var(--text-primary)]">
          {formatNumber(counted, prefix, suffix)}
        </p>
        <p className="text-sm text-[var(--text-secondary)]">{label}</p>
      </motion.div>
    </Card>
  );
}

export { StatCard, type StatCardProps };
