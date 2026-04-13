"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Kanban,
  Users,
  Building2,
  CheckSquare,
  BarChart3,
  Zap,
  Trophy,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { sidebar as sidebarVariants, overlay } from "@/lib/motion";
import { Avatar } from "@/components/ui";
import { useOrganization } from "@/lib/organization";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/contacts", label: "Contatos", icon: Users },
  { href: "/companies", label: "Empresas", icon: Building2 },
  { href: "/tasks", label: "Tarefas", icon: CheckSquare },
  { href: "/reports", label: "Relatórios", icon: BarChart3 },
  { href: "/automations", label: "Automações", icon: Zap },
  { href: "/ranking", label: "Ranking", icon: Trophy },
  { href: "/settings", label: "Configurações", icon: Settings },
] as const;

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
  userName?: string;
  userEmail?: string;
}

function Sidebar({ mobileOpen, onMobileClose, userName, userEmail }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { isB2C } = useOrganization();

  const filteredNavItems = isB2C
    ? navItems.filter((item) => item.href !== "/companies")
    : navItems;

  const toggleCollapse = useCallback(() => setCollapsed((p) => !p), []);

  const displayName = userName || "Usuário";
  const displayEmail = userEmail || "usuario@axcend.com";

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-[var(--border-default)] px-4">
        <span className="text-xl font-bold">
          <span className="text-orange-500">A</span>
          {!collapsed && (
            <span className="text-[var(--text-primary)]">xcend</span>
          )}
        </span>

        {/* Collapse toggle — desktop only */}
        <button
          onClick={toggleCollapse}
          className="ml-auto hidden text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors lg:block"
          aria-label={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
        >
          {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
        </button>

        {/* Close — mobile only */}
        <button
          onClick={onMobileClose}
          className="ml-auto text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors lg:hidden"
          aria-label="Fechar menu"
        >
          <X size={20} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <ul className="flex flex-col gap-0.5">
          {filteredNavItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onMobileClose}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors relative",
                    isActive
                      ? "bg-orange-500/10 text-orange-500"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]",
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-orange-500" />
                  )}
                  <Icon size={20} className="shrink-0" />
                  {!collapsed && <span>{label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User footer */}
      <div className="border-t border-[var(--border-default)] p-4">
        <div className="flex items-center gap-3">
          <Avatar name={displayName} size="sm" />
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                {displayName}
              </p>
              <p className="truncate text-xs text-[var(--text-muted)]">
                {displayEmail}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 hidden h-dvh border-r border-[var(--border-default)] bg-[var(--bg-surface)] transition-[width] duration-200 lg:block",
          collapsed ? "w-[68px]" : "w-60",
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              variants={overlay}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 z-40 bg-[var(--bg-overlay)] lg:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              variants={sidebarVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed left-0 top-0 z-50 h-dvh w-60 border-r border-[var(--border-default)] bg-[var(--bg-surface)] lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export { Sidebar, type SidebarProps };
