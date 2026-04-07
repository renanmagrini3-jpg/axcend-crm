"use client";

import { forwardRef, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/cn";
import { cardHover } from "@/lib/motion";

interface CardProps extends HTMLMotionProps<"div"> {
  hoverable?: boolean;
  children: ReactNode;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hoverable = true, className, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={hoverable ? cardHover : undefined}
        className={cn(
          "rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 transition-colors",
          className,
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  },
);

Card.displayName = "Card";

export { Card, type CardProps };
