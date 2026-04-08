"use client";

import { motion } from "framer-motion";
import {
  Phone,
  MessageSquare,
  Mail,
  Video,
  RotateCcw,
  FileText,
  Settings,
  Check,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { cardHover } from "@/lib/motion";
import { Badge } from "@/components/ui";
import { Avatar } from "@/components/ui";
import type { TaskType, TaskStatus, Priority } from "@/types";

// --- Types ---

export interface TaskCardData {
  id: string;
  title: string;
  type: TaskType;
  priority: Priority;
  status: TaskStatus;
  dueDate: Date;
  contactName: string;
  assignedTo: {
    name: string;
    avatar?: string;
  };
}

interface TaskCardProps {
  task: TaskCardData;
  onToggleComplete: (id: string) => void;
}

// --- Helpers ---

const typeIcons: Record<TaskType, typeof Phone> = {
  CALL: Phone,
  WHATSAPP: MessageSquare,
  EMAIL: Mail,
  MEETING: Video,
  FOLLOW_UP: RotateCcw,
  PROPOSAL: FileText,
  CUSTOM: Settings,
};

const typeLabels: Record<TaskType, string> = {
  CALL: "Ligação",
  WHATSAPP: "WhatsApp",
  EMAIL: "E-mail",
  MEETING: "Reunião",
  FOLLOW_UP: "Follow-up",
  PROPOSAL: "Proposta",
  CUSTOM: "Personalizada",
};

const priorityConfig: Record<Priority, { label: string; variant: "danger" | "warning" | "info" }> = {
  HIGH: { label: "Alta", variant: "danger" },
  MEDIUM: { label: "Média", variant: "warning" },
  LOW: { label: "Baixa", variant: "info" },
};

const statusConfig: Record<TaskStatus, { label: string; variant: "default" | "success" | "danger" }> = {
  PENDING: { label: "Pendente", variant: "default" },
  COMPLETED: { label: "Realizada", variant: "success" },
  OVERDUE: { label: "Vencida", variant: "danger" },
};

function formatDueDate(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dueDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const time = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (dueDay.getTime() === today.getTime()) return `Hoje, ${time}`;
  if (dueDay.getTime() === tomorrow.getTime()) return `Amanhã, ${time}`;

  const day = date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
  return `${day}, ${time}`;
}

// --- Component ---

function TaskCard({ task, onToggleComplete }: TaskCardProps) {
  const Icon = typeIcons[task.type];
  const priority = priorityConfig[task.priority];
  const status = statusConfig[task.status];
  const isCompleted = task.status === "COMPLETED";
  const isOverdue = task.status === "OVERDUE";

  return (
    <motion.div
      whileHover={cardHover}
      className={cn(
        "flex items-start gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 transition-colors",
        isOverdue && "border-l-2 border-l-red-500",
        isCompleted && "opacity-60",
      )}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggleComplete(task.id)}
        aria-label={isCompleted ? "Desmarcar tarefa" : "Marcar como concluída"}
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
          isCompleted
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-[var(--border-default)] hover:border-orange-500",
        )}
      >
        {isCompleted && <Check size={12} strokeWidth={3} />}
      </button>

      {/* Icon */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
        <Icon size={18} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "text-sm font-medium text-[var(--text-primary)]",
              isCompleted && "line-through",
            )}
          >
            {task.title}
          </span>
          <Badge variant={priority.variant} size="sm">
            {priority.label}
          </Badge>
          <Badge variant={status.variant} size="sm">
            {status.label}
          </Badge>
        </div>

        <div className="mt-1.5 flex items-center gap-3 text-xs text-[var(--text-secondary)]">
          <span>{typeLabels[task.type]}</span>
          <span>·</span>
          <span>{task.contactName}</span>
          <span>·</span>
          <span className={cn(isOverdue && "text-red-500 font-medium")}>
            {formatDueDate(task.dueDate)}
          </span>
        </div>
      </div>

      {/* Assignee avatar */}
      <Avatar
        name={task.assignedTo.name}
        src={task.assignedTo.avatar}
        size="sm"
      />
    </motion.div>
  );
}

export { TaskCard };
