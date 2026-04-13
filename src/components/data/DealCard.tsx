"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { cardHover } from "@/lib/motion";
import { Badge, Avatar } from "@/components/ui";
import { useOrganization } from "@/lib/organization";
import type { Priority } from "@/types";

export interface DealCardData {
  id: string;
  title: string;
  value: number;
  priority: Priority;
  contactName: string;
  contactPhone?: string;
  companyName?: string;
  assigneeName: string;
  assigneeAvatar?: string;
  lossReason?: string | null;
  stageName?: string;
  createdAt: Date;
  nextTask?: string | null;
  notesCount?: number;
}

interface DealCardProps {
  deal: DealCardData;
  onClick?: () => void;
}

const priorityVariant: Record<Priority, "danger" | "warning" | "info"> = {
  HIGH: "danger",
  MEDIUM: "warning",
  LOW: "info",
};

const priorityLabel: Record<Priority, string> = {
  HIGH: "Alta",
  MEDIUM: "Média",
  LOW: "Baixa",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "hoje";
  if (diffDays === 1) return "há 1 dia";
  if (diffDays < 30) return `há ${diffDays} dias`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return "há 1 mês";
  return `há ${diffMonths} meses`;
}

function DealCard({ deal, onClick }: DealCardProps) {
  const { isB2C } = useOrganization();

  return (
    <motion.div
      whileHover={cardHover}
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-3 transition-colors",
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-[var(--text-primary)] line-clamp-1">
          {isB2C ? deal.contactName : deal.title}
        </p>
        <Badge variant={priorityVariant[deal.priority]} size="sm">
          {priorityLabel[deal.priority]}
        </Badge>
      </div>

      <p className="text-xs text-[var(--text-secondary)] line-clamp-1">
        {isB2C ? deal.title : (
          <>
            {deal.contactName}
            {deal.companyName && ` · ${deal.companyName}`}
          </>
        )}
      </p>

      <p className="mt-2 text-lg font-bold text-[var(--text-primary)]">
        {formatCurrency(deal.value)}
      </p>

      {deal.contactPhone && (
        <p className="mt-1 text-xs text-[var(--text-muted)] truncate">
          {deal.contactPhone}
        </p>
      )}

      {deal.nextTask && (
        <p className="mt-1 truncate rounded bg-orange-500/10 px-1.5 py-0.5 text-[10px] text-orange-400">
          {deal.nextTask}
        </p>
      )}

      {deal.stageName === "Fechado Perdido" && deal.lossReason && (
        <p className="mt-1 truncate rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] text-red-400">
          {deal.lossReason}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Avatar
            name={deal.assigneeName}
            src={deal.assigneeAvatar}
            size="sm"
          />
          <span className="text-xs text-[var(--text-muted)] truncate max-w-[80px]">
            {deal.assigneeName}
          </span>
        </div>
        <span className="text-xs text-[var(--text-muted)]">
          {timeAgo(deal.createdAt)}
        </span>
      </div>
    </motion.div>
  );
}

export { DealCard };
