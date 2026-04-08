"use client";

import { useState, useMemo, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { staggerContainer, staggerChild } from "@/lib/motion";
import { Skeleton } from "@/components/ui";

// --- Types ---

interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => ReactNode;
}

type SortDirection = "asc" | "desc";

interface DataTableProps<T extends { id: string }> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  selectedId?: string | null;
  emptyMessage?: string;
}

// --- Component ---

function DataTable<T extends { id: string }>({
  columns,
  data,
  loading = false,
  pageSize = 10,
  onRowClick,
  selectedId,
  emptyMessage = "Nenhum resultado encontrado",
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>("asc");
  const [page, setPage] = useState(0);

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(0);
  }

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const av = (a as Record<string, unknown>)[sortKey];
      const bv = (b as Record<string, unknown>)[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc"
          ? av.localeCompare(bv, "pt-BR")
          : bv.localeCompare(av, "pt-BR");
      }
      if (av instanceof Date && bv instanceof Date) {
        return sortDir === "asc"
          ? av.getTime() - bv.getTime()
          : bv.getTime() - av.getTime();
      }
      const na = Number(av);
      const nb = Number(bv);
      return sortDir === "asc" ? na - nb : nb - na;
    });
  }, [data, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice(page * pageSize, (page + 1) * pageSize);

  // --- Loading skeleton ---
  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-default)]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr
                key={i}
                className="border-b border-[var(--border-default)] last:border-b-0"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <Skeleton className="h-4 w-3/4" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // --- Empty state ---
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] py-16">
        <div className="mb-3 h-12 w-12 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center">
          <ChevronsUpDown
            size={20}
            className="text-[var(--text-muted)]"
          />
        </div>
        <p className="text-sm text-[var(--text-muted)]">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-default)]">
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                const canSort = col.sortable !== false;

                return (
                  <th
                    key={col.key}
                    className={cn(
                      "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]",
                      canSort && "cursor-pointer select-none hover:text-[var(--text-primary)] transition-colors",
                    )}
                    onClick={canSort ? () => handleSort(col.key) : undefined}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {canSort && (
                        <span className="inline-flex flex-col">
                          {isSorted ? (
                            sortDir === "asc" ? (
                              <ChevronUp size={14} className="text-orange-500" />
                            ) : (
                              <ChevronDown size={14} className="text-orange-500" />
                            )
                          ) : (
                            <ChevronsUpDown size={14} className="opacity-40" />
                          )}
                        </span>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>

          <motion.tbody
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {paginated.map((row) => (
              <motion.tr
                key={row.id}
                variants={staggerChild}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "border-b border-[var(--border-default)] last:border-b-0 transition-colors",
                  onRowClick && "cursor-pointer",
                  selectedId === row.id
                    ? "bg-orange-500/5"
                    : "hover:bg-[var(--bg-elevated)]",
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-4 py-3 text-[var(--text-primary)] whitespace-nowrap"
                  >
                    {col.render
                      ? col.render(row)
                      : String(
                          (row as Record<string, unknown>)[col.key] ?? "—",
                        )}
                  </td>
                ))}
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-[var(--border-default)] px-4 py-3">
        <p className="text-xs text-[var(--text-muted)]">
          {sorted.length === 0
            ? "0 registros"
            : `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, sorted.length)} de ${sorted.length}`}
        </p>

        <div className="flex items-center gap-1">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated)] disabled:opacity-30 disabled:pointer-events-none"
            aria-label="Página anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="min-w-[3rem] text-center text-xs text-[var(--text-secondary)]">
            {page + 1} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated)] disabled:opacity-30 disabled:pointer-events-none"
            aria-label="Próxima página"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export { DataTable, type Column, type DataTableProps };
