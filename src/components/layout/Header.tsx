"use client";

import { useState, useRef, useEffect, useCallback, Fragment } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Search, Sun, Moon, Menu, User, Settings, LogOut, Zap, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui";
import { createBrowserClient } from "@/lib/supabase/client";

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
  userName?: string;
  userEmail?: string;
}

// ── Notification types ──

interface Notification {
  id: string;
  type: "automation" | "task_overdue";
  title: string;
  description: string;
  timestamp: string;
}

// ── Search result types ──

interface SearchResults {
  deals: { id: string; title: string; value: number }[];
  contacts: { id: string; name: string; email: string | null }[];
  companies: { id: string; name: string }[];
}

function formatTimeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function Header({ onMenuClick, userName, userEmail }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Notifications state
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifLoaded, setNotifLoaded] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const displayName = userName || userEmail || "Usuário";

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

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Fetch notifications
  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data as Notification[]);
      }
    } catch { /* ignore */ }
    setNotifLoaded(true);
  }, []);

  const handleNotifToggle = useCallback(() => {
    setNotifOpen((p) => !p);
    if (!notifLoaded) loadNotifications();
  }, [notifLoaded, loadNotifications]);

  // Search with debounce
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults(null);
      setSearchOpen(false);
      return;
    }

    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data as SearchResults);
          setSearchOpen(true);
        }
      } catch { /* ignore */ }
    }, 300);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery]);

  const navigateAndClose = useCallback((href: string) => {
    setSearchOpen(false);
    setSearchQuery("");
    router.push(href);
  }, [router]);

  async function handleSignOut() {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const totalResults = searchResults
    ? searchResults.deals.length + searchResults.contacts.length + searchResults.companies.length
    : 0;

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
      <div className="relative hidden max-w-xs flex-1 md:block" ref={searchRef}>
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder="Buscar deals, contatos, empresas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => { if (searchResults && totalResults > 0) setSearchOpen(true); }}
          className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] py-2 pl-9 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-focus)] focus:outline-none transition-colors"
        />

        {/* Search results dropdown */}
        {searchOpen && searchResults && totalResults > 0 && (
          <div className="absolute left-0 top-full mt-1 w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] py-1 shadow-lg max-h-80 overflow-y-auto z-50">
            {searchResults.deals.length > 0 && (
              <>
                <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Deals</p>
                {searchResults.deals.map((d) => (
                  <button key={d.id} onClick={() => navigateAndClose("/pipeline")} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors">
                    <span className="truncate flex-1 text-left">{d.title}</span>
                    <span className="text-xs text-[var(--text-muted)]">R$ {Number(d.value).toLocaleString("pt-BR")}</span>
                  </button>
                ))}
              </>
            )}
            {searchResults.contacts.length > 0 && (
              <>
                <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Contatos</p>
                {searchResults.contacts.map((c) => (
                  <button key={c.id} onClick={() => navigateAndClose("/contacts")} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors">
                    <span className="truncate flex-1 text-left">{c.name}</span>
                    {c.email && <span className="text-xs text-[var(--text-muted)] truncate max-w-[120px]">{c.email}</span>}
                  </button>
                ))}
              </>
            )}
            {searchResults.companies.length > 0 && (
              <>
                <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Empresas</p>
                {searchResults.companies.map((co) => (
                  <button key={co.id} onClick={() => navigateAndClose("/companies")} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors">
                    <span className="truncate flex-1 text-left">{co.name}</span>
                  </button>
                ))}
              </>
            )}
          </div>
        )}

        {searchOpen && searchResults && totalResults === 0 && searchQuery.length >= 2 && (
          <div className="absolute left-0 top-full mt-1 w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] py-4 shadow-lg z-50 text-center text-sm text-[var(--text-muted)]">
            Nenhum resultado encontrado
          </div>
        )}
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
        <div className="relative" ref={notifRef}>
          <button
            onClick={handleNotifToggle}
            className="relative rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Notificações"
          >
            <Bell size={20} />
            {notifications.length > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
                {notifications.length}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-lg z-50">
              <div className="border-b border-[var(--border-default)] px-4 py-3">
                <p className="text-sm font-semibold text-[var(--text-primary)]">Notificações</p>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="py-8 text-center text-sm text-[var(--text-muted)]">Nenhuma notificação</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="flex items-start gap-3 border-b border-[var(--border-subtle)] px-4 py-3 last:border-0 hover:bg-[var(--bg-elevated)] transition-colors">
                      <div className={cn(
                        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                        n.type === "task_overdue" ? "bg-red-500/10 text-red-500" : "bg-orange-500/10 text-orange-500",
                      )}>
                        {n.type === "task_overdue" ? <AlertTriangle size={14} /> : <Zap size={14} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[var(--text-primary)]">{n.title}</p>
                        <p className="text-xs text-[var(--text-muted)] truncate">{n.description}</p>
                      </div>
                      <span className="shrink-0 text-[10px] text-[var(--text-muted)]">{formatTimeAgo(n.timestamp)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

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
            <Avatar name={displayName} size="sm" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] py-1 shadow-lg z-50">
              <div className="px-4 py-2 border-b border-[var(--border-default)]">
                <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                  {displayName}
                </p>
                {userEmail && (
                  <p className="truncate text-xs text-[var(--text-muted)]">
                    {userEmail}
                  </p>
                )}
              </div>
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
                onClick={handleSignOut}
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
