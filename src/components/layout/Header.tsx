"use client";

import { useState, useRef, useEffect, useCallback, Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search, Sun, Moon, Menu, User, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui";

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  pipeline: "Pipeline",
  contacts: "Contatos",
  companies: "Empresas",
  tasks: "Tarefas",
  reports: "Relatórios",
  automations: "Automações",
  ranking: "Ranking",
  settings: "Configurações",
};

interface HeaderProps {
  onMenuClick: () => void;
}

function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Build breadcrumbs
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((seg, i) => ({
    label: routeLabels[seg] ?? seg,
    href: "/" + segments.slice(0, i + 1).join("/"),
  }));

  // Toggle theme
  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      return next;
    });
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-[var(--border-default)] bg-[var(--bg-surface)]/80 px-4 backdrop-blur-sm lg:px-6">
      {/* Mobile menu trigger */}
      <button
        onClick={onMenuClick}
        className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors lg:hidden"
        aria-label="Abrir menu"
      >
        <Menu size={22} />
      </button>

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="hidden items-center gap-1 text-sm lg:flex">
        {breadcrumbs.map((crumb, i) => (
          <Fragment key={crumb.href}>
            {i > 0 && <span className="text-[var(--text-muted)]">/</span>}
            {i === breadcrumbs.length - 1 ? (
              <span className="font-medium text-[var(--text-primary)]">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                {crumb.label}
              </Link>
            )}
          </Fragment>
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="relative hidden max-w-xs flex-1 md:block">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder="Buscar..."
          className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] py-2 pl-9 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-focus)] focus:outline-none transition-colors"
        />
      </div>

      {/* Mobile search icon */}
      <button
        className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors md:hidden"
        aria-label="Buscar"
      >
        <Search size={20} />
      </button>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Notifications */}
        <button
          className="relative rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Notificações"
        >
          <Bell size={20} />
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
            3
          </span>
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
          aria-label={theme === "dark" ? "Modo claro" : "Modo escuro"}
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((p) => !p)}
            className="rounded-lg p-1 hover:bg-[var(--bg-elevated)] transition-colors"
            aria-label="Menu do usuário"
          >
            <Avatar name="Usuário" size="sm" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] py-1 shadow-lg">
              <Link
                href="/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
              >
                <User size={16} /> Perfil
              </Link>
              <Link
                href="/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
              >
                <Settings size={16} /> Configurações
              </Link>
              <hr className="my-1 border-[var(--border-default)]" />
              <button
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-[var(--bg-elevated)] transition-colors"
              >
                <LogOut size={16} /> Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export { Header, type HeaderProps };
