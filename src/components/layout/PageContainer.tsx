"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/motion";
import { cn } from "@/lib/cn";

interface PageContainerProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

function PageContainer({ title, description, children, className }: PageContainerProps) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className={cn("px-4 py-6 lg:px-6", className)}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>
        )}
      </div>
      {children}
    </motion.div>
  );
}

export { PageContainer, type PageContainerProps };
