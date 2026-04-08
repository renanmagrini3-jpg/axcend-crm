"use client";

import { useState, useMemo, useCallback } from "react";
import { Plus, Search, Filter, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { PageContainer } from "@/components/layout";
import { Button, Badge } from "@/components/ui";
import { TaskList } from "@/components/data/TaskList";
import { TaskCard } from "@/components/data/TaskCard";
import { NewTaskModal } from "@/components/data/NewTaskModal";
import { staggerContainer, staggerChild } from "@/lib/motion";
import { cn } from "@/lib/cn";
import type { TaskType, Priority, TaskStatus } from "@/types";
import type { TaskCardData } from "@/components/data/TaskCard";

// --- Mock Data ---

function d(offset: number, hour: number, minute: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  date.setHours(hour, minute, 0, 0);
  return date;
}

const mockTasks: TaskCardData[] = [
  {
    id: "t1",
    title: "Ligar para confirmar reunião de discovery",
    type: "CALL",
    priority: "HIGH",
    status: "OVERDUE",
    dueDate: d(-2, 10, 0),
    contactName: "Lucas Ferreira",
    assignedTo: { name: "Ana Paula" },
  },
  {
    id: "t2",
    title: "Enviar proposta comercial atualizada",
    type: "PROPOSAL",
    priority: "HIGH",
    status: "OVERDUE",
    dueDate: d(-1, 14, 0),
    contactName: "Mariana Costa",
    assignedTo: { name: "Ricardo Souza" },
  },
  {
    id: "t3",
    title: "Follow-up após demonstração do produto",
    type: "FOLLOW_UP",
    priority: "HIGH",
    status: "PENDING",
    dueDate: d(0, 9, 0),
    contactName: "Rafael Oliveira",
    assignedTo: { name: "Ana Paula" },
  },
  {
    id: "t4",
    title: "Enviar material de onboarding por e-mail",
    type: "EMAIL",
    priority: "MEDIUM",
    status: "PENDING",
    dueDate: d(0, 11, 30),
    contactName: "Camila Santos",
    assignedTo: { name: "Ricardo Souza" },
  },
  {
    id: "t5",
    title: "Reunião de alinhamento com time técnico",
    type: "MEETING",
    priority: "HIGH",
    status: "PENDING",
    dueDate: d(0, 14, 30),
    contactName: "Pedro Almeida",
    assignedTo: { name: "Ana Paula" },
  },
  {
    id: "t6",
    title: "Mensagem de acompanhamento no WhatsApp",
    type: "WHATSAPP",
    priority: "MEDIUM",
    status: "PENDING",
    dueDate: d(0, 16, 0),
    contactName: "Juliana Mendes",
    assignedTo: { name: "Carlos Lima" },
  },
  {
    id: "t7",
    title: "Preparar apresentação de ROI",
    type: "CUSTOM",
    priority: "MEDIUM",
    status: "PENDING",
    dueDate: d(0, 17, 0),
    contactName: "Thiago Nascimento",
    assignedTo: { name: "Ricardo Souza" },
  },
  {
    id: "t8",
    title: "Ligar para negociar desconto de volume",
    type: "CALL",
    priority: "HIGH",
    status: "PENDING",
    dueDate: d(1, 9, 30),
    contactName: "Fernanda Rocha",
    assignedTo: { name: "Ana Paula" },
  },
  {
    id: "t9",
    title: "Enviar contrato para assinatura digital",
    type: "EMAIL",
    priority: "HIGH",
    status: "PENDING",
    dueDate: d(1, 11, 0),
    contactName: "Bruno Carvalho",
    assignedTo: { name: "Carlos Lima" },
  },
  {
    id: "t10",
    title: "Reunião de kickoff do projeto",
    type: "MEETING",
    priority: "MEDIUM",
    status: "PENDING",
    dueDate: d(2, 10, 0),
    contactName: "Lucas Ferreira",
    assignedTo: { name: "Ricardo Souza" },
  },
  {
    id: "t11",
    title: "WhatsApp de boas-vindas ao novo cliente",
    type: "WHATSAPP",
    priority: "LOW",
    status: "PENDING",
    dueDate: d(3, 9, 0),
    contactName: "Amanda Vieira",
    assignedTo: { name: "Ana Paula" },
  },
  {
    id: "t12",
    title: "Follow-up de proposta enviada",
    type: "FOLLOW_UP",
    priority: "MEDIUM",
    status: "PENDING",
    dueDate: d(4, 14, 0),
    contactName: "Mariana Costa",
    assignedTo: { name: "Carlos Lima" },
  },
  {
    id: "t13",
    title: "Enviar case de sucesso por e-mail",
    type: "EMAIL",
    priority: "LOW",
    status: "COMPLETED",
    dueDate: d(-1, 10, 0),
    contactName: "Camila Santos",
    assignedTo: { name: "Ricardo Souza" },
  },
  {
    id: "t14",
    title: "Ligação de qualificação de lead",
    type: "CALL",
    priority: "MEDIUM",
    status: "COMPLETED",
    dueDate: d(-1, 15, 0),
    contactName: "Thiago Nascimento",
    assignedTo: { name: "Ana Paula" },
  },
  {
    id: "t15",
    title: "Proposta de upsell para plano Enterprise",
    type: "PROPOSAL",
    priority: "HIGH",
    status: "PENDING",
    dueDate: d(6, 10, 0),
    contactName: "Pedro Almeida",
    assignedTo: { name: "Carlos Lima" },
  },
];

// --- Tab & Filter config ---

type TabKey = "all" | "pending" | "today" | "overdue" | "completed" | "calendar";

interface Tab {
  key: TabKey;
  label: string;
}

const tabs: Tab[] = [
  { key: "all", label: "Todas" },
  { key: "pending", label: "Pendentes" },
  { key: "today", label: "Hoje" },
  { key: "overdue", label: "Vencidas" },
  { key: "completed", label: "Realizadas" },
  { key: "calendar", label: "Calendário" },
];

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

// --- Page ---

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskCardData[]>(mockTasks);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [filterType, setFilterType] = useState<TaskType | "">("");
  const [filterPriority, setFilterPriority] = useState<Priority | "">("");
  const [modalOpen, setModalOpen] = useState(false);
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const handleToggleComplete = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: t.status === "COMPLETED" ? ("PENDING" as TaskStatus) : ("COMPLETED" as TaskStatus) }
          : t,
      ),
    );
  }, []);

  const filtered = useMemo(() => {
    let result = tasks;

    // Tab filter
    if (activeTab === "pending") result = result.filter((t) => t.status === "PENDING");
    else if (activeTab === "today") result = result.filter((t) => isToday(t.dueDate) && t.status !== "COMPLETED");
    else if (activeTab === "overdue") result = result.filter((t) => t.status === "OVERDUE");
    else if (activeTab === "completed") result = result.filter((t) => t.status === "COMPLETED");

    // Type filter
    if (filterType) result = result.filter((t) => t.type === filterType);

    // Priority filter
    if (filterPriority) result = result.filter((t) => t.priority === filterPriority);

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.contactName.toLowerCase().includes(q),
      );
    }

    return result;
  }, [tasks, activeTab, filterType, filterPriority, search]);

  // Tab counts
  const counts: Record<TabKey, number> = useMemo(() => ({
    all: tasks.length,
    pending: tasks.filter((t) => t.status === "PENDING").length,
    today: tasks.filter((t) => isToday(t.dueDate) && t.status !== "COMPLETED").length,
    overdue: tasks.filter((t) => t.status === "OVERDUE").length,
    completed: tasks.filter((t) => t.status === "COMPLETED").length,
    calendar: tasks.length,
  }), [tasks]);

  // Group tasks by day key (YYYY-MM-DD) for the calendar
  const calendarTasks = useMemo(() => {
    const map = new Map<string, TaskCardData[]>();
    for (const task of tasks) {
      const d = task.dueDate;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const arr = map.get(key) ?? [];
      arr.push(task);
      map.set(key, arr);
    }
    return map;
  }, [tasks]);

  // --- Inline Calendar Component ---
  function TaskCalendar() {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const today = new Date();

    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const monthNames = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
    ];
    const dayHeaders = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    const prevMonth = () => {
      setCalendarDate(new Date(year, month - 1, 1));
      setSelectedDay(null);
    };
    const nextMonth = () => {
      setCalendarDate(new Date(year, month + 1, 1));
      setSelectedDay(null);
    };

    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    const dayKey = (day: number) =>
      `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const selectedDayTasks = selectedDay ? (calendarTasks.get(dayKey(selectedDay)) ?? []) : [];

    return (
      <motion.div variants={staggerChild} initial="hidden" animate="visible">
        {/* Calendar card */}
        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={prevMonth}
              className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {monthNames[month]} {year}
            </h3>
            <button
              onClick={nextMonth}
              className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {dayHeaders.map((dh) => (
              <div key={dh} className="text-center text-xs font-medium text-[var(--text-muted)] py-1">
                {dh}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for offset */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const key = dayKey(day);
              const dayTasks = calendarTasks.get(key) ?? [];
              const count = dayTasks.length;
              const hasOverdue = dayTasks.some((t) => t.status === "OVERDUE");
              const isTodayCell = isCurrentMonth && today.getDate() === day;
              const isSelected = selectedDay === day;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={cn(
                    "relative flex flex-col items-center justify-center rounded-lg aspect-square text-sm transition-colors",
                    isTodayCell && "ring-1 ring-orange-500",
                    isSelected && "bg-orange-500/20 ring-1 ring-orange-500",
                    !isSelected && count === 1 && "bg-orange-500/5",
                    !isSelected && count === 2 && "bg-orange-500/10",
                    !isSelected && count >= 3 && "bg-orange-500/15",
                    !isSelected && count === 0 && "hover:bg-[var(--bg-elevated)]",
                    !isSelected && count > 0 && "hover:bg-orange-500/20",
                  )}
                >
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isTodayCell ? "text-orange-500" : "text-[var(--text-primary)]",
                    )}
                  >
                    {day}
                  </span>
                  {count > 0 && (
                    <span className="text-[10px] font-medium text-orange-500">
                      {count}
                    </span>
                  )}
                  {hasOverdue && (
                    <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-red-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected day tasks */}
        {selectedDay !== null && (
          <div className="mt-4 space-y-3">
            <h4 className="text-sm font-medium text-[var(--text-secondary)]">
              Tarefas em {selectedDay} de {monthNames[month]}
            </h4>
            {selectedDayTasks.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">Nenhuma tarefa para este dia.</p>
            ) : (
              selectedDayTasks.map((task) => (
                <TaskCard key={task.id} task={task} onToggleComplete={handleToggleComplete} />
              ))
            )}
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <PageContainer title="Tarefas" description="Gerencie suas atividades e compromissos">
      {/* Header / Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          />
          <input
            type="text"
            placeholder="Buscar tarefa ou contato..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] pl-9 pr-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-focus)] focus:outline-none transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-[var(--text-muted)]" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as TaskType | "")}
            className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-2.5 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none transition-colors"
          >
            <option value="">Tipo</option>
            <option value="CALL">Ligação</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="EMAIL">E-mail</option>
            <option value="MEETING">Reunião</option>
            <option value="FOLLOW_UP">Follow-up</option>
            <option value="PROPOSAL">Proposta</option>
            <option value="CUSTOM">Personalizada</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as Priority | "")}
            className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-2.5 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none transition-colors"
          >
            <option value="">Prioridade</option>
            <option value="HIGH">Alta</option>
            <option value="MEDIUM">Média</option>
            <option value="LOW">Baixa</option>
          </select>
        </div>

        <div className="flex-1" />

        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={16} />}
          onClick={() => setModalOpen(true)}
        >
          Nova Tarefa
        </Button>
      </div>

      {/* Tabs */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="mb-6 flex gap-1 overflow-x-auto rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] p-1"
      >
        {tabs.map((tab) => (
          <motion.button
            key={tab.key}
            variants={staggerChild}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
              activeTab === tab.key
                ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
            )}
          >
            {tab.label}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-xs",
                activeTab === tab.key
                  ? "bg-orange-500/15 text-orange-500"
                  : "bg-[var(--bg-surface)] text-[var(--text-muted)]",
              )}
            >
              {counts[tab.key]}
            </span>
          </motion.button>
        ))}
      </motion.div>

      {/* Task List / Calendar */}
      {activeTab === "calendar" ? (
        <TaskCalendar />
      ) : (
        <TaskList tasks={filtered} onToggleComplete={handleToggleComplete} />
      )}

      {/* New Task Modal */}
      <NewTaskModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </PageContainer>
  );
}
