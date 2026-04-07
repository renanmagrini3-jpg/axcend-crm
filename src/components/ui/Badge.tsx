import { type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "default";
type BadgeSize = "sm" | "md";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-emerald-500/15 text-emerald-500 border-emerald-500/25",
  warning: "bg-amber-500/15 text-amber-500 border-amber-500/25",
  danger: "bg-red-500/15 text-red-500 border-red-500/25",
  info: "bg-blue-500/15 text-blue-500 border-blue-500/25",
  default:
    "bg-neutral-500/15 text-[var(--text-secondary)] border-[var(--border-default)]",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-1.5 py-0.5 text-xs",
  md: "px-2.5 py-1 text-xs",
};

function Badge({
  variant = "default",
  size = "md",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium whitespace-nowrap",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export { Badge, type BadgeProps };
