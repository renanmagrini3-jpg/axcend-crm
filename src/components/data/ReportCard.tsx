"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { Card } from "@/components/ui";
import { Button } from "@/components/ui";
import { staggerChild } from "@/lib/motion";
import { cn } from "@/lib/cn";

type ReportColor = "orange" | "blue" | "green" | "yellow" | "purple" | "red";

interface ReportCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  color?: ReportColor;
  onGenerate?: () => void;
}

const colorMap: Record<ReportColor, { bg: string; text: string }> = {
  orange: { bg: "bg-orange-500/10", text: "text-orange-500" },
  blue: { bg: "bg-blue-500/10", text: "text-blue-500" },
  green: { bg: "bg-emerald-500/10", text: "text-emerald-500" },
  yellow: { bg: "bg-amber-500/10", text: "text-amber-500" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-500" },
  red: { bg: "bg-red-500/10", text: "text-red-500" },
};

function ReportCard({
  icon,
  title,
  description,
  color = "orange",
  onGenerate,
}: ReportCardProps) {
  const colors = colorMap[color];

  return (
    <motion.div variants={staggerChild}>
      <Card className="flex h-full flex-col gap-4">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-lg",
            colors.bg,
            colors.text,
          )}
        >
          {icon}
        </div>

        <div className="flex flex-1 flex-col gap-1">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            {title}
          </h3>
          <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
            {description}
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={<FileText size={14} />}
          onClick={onGenerate}
          className="w-full"
        >
          Gerar Relatório
        </Button>
      </Card>
    </motion.div>
  );
}

export { ReportCard, type ReportCardProps };
