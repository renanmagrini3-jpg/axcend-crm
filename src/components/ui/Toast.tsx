"use client";

import {
  createContext,
  useContext,
  useCallback,
  useState,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import { toast as toastVariants } from "@/lib/motion";

type ToastVariant = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const variantStyles: Record<ToastVariant, string> = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
  error: "border-red-500/30 bg-red-500/10 text-red-500",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-500",
  info: "border-blue-500/30 bg-blue-500/10 text-blue-500",
};

const icons: Record<ToastVariant, ReactNode> = {
  success: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M4.5 9.5L7.5 12.5L13.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  error: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M6 6l6 6M12 6l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  warning: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 6v3.5M9 12h.007" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  info: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 8v4M9 6h.007" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

let toastCounter = 0;

function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = `toast-${++toastCounter}`;
    setToasts((prev) => [...prev, { id, message, variant }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}

      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              variants={toastVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              layout
              className={cn(
                "flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium shadow-lg backdrop-blur-sm min-w-[280px] max-w-[400px]",
                variantStyles[t.variant],
              )}
            >
              <span className="shrink-0">{icons[t.variant]}</span>
              <span className="flex-1">{t.message}</span>
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                aria-label="Fechar"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M10.5 3.5l-7 7M3.5 3.5l7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export { ToastProvider, useToast, type ToastVariant, type ToastItem };
