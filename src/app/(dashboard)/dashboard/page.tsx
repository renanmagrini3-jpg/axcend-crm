"use client";

import { motion } from "framer-motion";
import { DollarSign, Target, TrendingUp, ListChecks } from "lucide-react";
import { PageContainer } from "@/components/layout";
import { Card } from "@/components/ui";
import { staggerContainer, staggerChild } from "@/lib/motion";
import type { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <Card>
      <motion.div variants={staggerChild} className="flex flex-col gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
          {icon}
        </div>
        <p className="text-4xl font-bold text-[var(--text-primary)]">{value}</p>
        <p className="text-sm text-[var(--text-secondary)]">{label}</p>
      </motion.div>
    </Card>
  );
}

const stats = [
  { icon: <DollarSign size={22} />, label: "Receita do Mês", value: "R$ 0,00" },
  { icon: <Target size={22} />, label: "Deals no Pipeline", value: "0" },
  { icon: <TrendingUp size={22} />, label: "Taxa de Conversão", value: "0%" },
  { icon: <ListChecks size={22} />, label: "Tarefas Pendentes", value: "0" },
];

export default function DashboardPage() {
  return (
    <PageContainer title="Dashboard" description="Visão geral do desempenho comercial">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
      >
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </motion.div>
    </PageContainer>
  );
}
