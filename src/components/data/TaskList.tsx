"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Calendar, CalendarClock, CalendarDays, CalendarRange } from "lucide-react";
import { cn } from "@/lib/cn";
import { staggerContainer, staggerChild } from "@/lib/motion";
import { TaskCard, type TaskCardData } from "./TaskCard";

// --- Types ---

interface TaskListProps {
  tasks: TaskCardData[];
  onToggleComplete: (id: string) => void;
  onTaskClick?: (task: TaskCardData) => void;
}

interface TaskSection {
  key: string;
  label: string;
  icon: typeof AlertTriangle;
  color: string;
  tasks: TaskCardData[];
}

// --- Helpers ---

function getDateGroup(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const endOfWeek = new Date(today);
  endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
  const dueDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (dueDay < today) return "overdue";
  if (dueDay.getTime() === today.getTime()) return "today";
  if (dueDay.getTime() === tomorrow.getTime()) return "tomorrow";
  if (dueDay <= endOfWeek) return "week";
  return "upcoming";
}

const sectionDefs: { key: string; label: string; icon: typeof AlertTriangle; color: string }[] = [
  { key: "overdue", label: "Atrasadas", icon: AlertTriangle, color: "text-red-500" },
  { key: "today", label: "Hoje", icon: Calendar, color: "text-orange-500" },
  { key: "tomorrow", label: "Amanhã", icon: CalendarClock, color: "text-[var(--text-primary)]" },
  { key: "week", label: "Esta Semana", icon: CalendarDays, color: "text-[var(--text-secondary)]" },
  { key: "upcoming", label: "Próximas", icon: CalendarRange, color: "text-[var(--text-secondary)]" },
];

// --- Component ---

function TaskList({ tasks, onToggleComplete, onTaskClick }: TaskListProps) {
  const sections = useMemo<TaskSection[]>(() => {
    const grouped: Record<string, TaskCardData[]> = {
      overdue: [],
      today: [],
      tomorrow: [],
      week: [],
      upcoming: [],
    };

    for (const task of tasks) {
      const group = task.status === "OVERDUE" ? "overdue" : getDateGroup(task.dueDate);
      grouped[group].push(task);
    }

    return sectionDefs
      .map((def) => ({ ...def, tasks: grouped[def.key] }))
      .filter((s) => s.tasks.length > 0);
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Calendar size={48} className="mb-3 text-[var(--text-muted)]" />
        <p className="text-sm text-[var(--text-secondary)]">Nenhuma tarefa encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sections.map((section) => {
        const SectionIcon = section.icon;

        return (
          <div key={section.key}>
            {/* Section header */}
            <div className="mb-3 flex items-center gap-2">
              <SectionIcon size={16} className={section.color} />
              <h3 className={cn("text-sm font-semibold", section.color)}>
                {section.label}
              </h3>
              <span className="rounded-full bg-[var(--bg-elevated)] px-2 py-0.5 text-xs font-medium text-[var(--text-secondary)]">
                {section.tasks.length}
              </span>
            </div>

            {/* Task cards with stagger */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-2"
            >
              {section.tasks.map((task) => (
                <motion.div key={task.id} variants={staggerChild}>
                  <TaskCard task={task} onToggleComplete={onToggleComplete} onClick={onTaskClick} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}

export { TaskList };
