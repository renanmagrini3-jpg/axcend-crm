"use client";

import { useEffect, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import {
  overlay as overlayVariants,
  modal as modalVariants,
} from "@/lib/motion";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  title?: string;
}

function Modal({ open, onClose, children, className, title }: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 bg-[var(--bg-overlay)]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              "relative z-10 w-full max-w-lg rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 shadow-xl",
              className,
            )}
          >
            {title && (
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="rounded-md p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  aria-label="Fechar"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M15 5L5 15M5 5l10 10"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export { Modal, type ModalProps };
