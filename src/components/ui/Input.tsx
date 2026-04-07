"use client";

import {
  forwardRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, onFocus, onBlur, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const hasValue =
      props.value !== undefined && props.value !== null && props.value !== "";
    const isFloating = focused || hasValue || !!props.placeholder;

    return (
      <div className="w-full">
        <div className="relative">
          {icon && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            className={cn(
              "peer w-full rounded-lg border bg-[var(--bg-surface)] px-3 pt-5 pb-2 text-sm text-[var(--text-primary)] placeholder-transparent transition-colors",
              "focus:border-[var(--border-focus)] focus:outline-none",
              icon && "pl-10",
              error
                ? "border-red-500 focus:border-red-500"
                : "border-[var(--border-default)]",
              className,
            )}
            placeholder={label}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            {...props}
          />

          <label
            className={cn(
              "pointer-events-none absolute transition-all duration-200",
              icon ? "left-10" : "left-3",
              isFloating
                ? "top-1.5 text-xs text-[var(--text-muted)]"
                : "top-1/2 -translate-y-1/2 text-sm text-[var(--text-secondary)]",
              error && isFloating && "text-red-500",
            )}
          >
            {label}
          </label>
        </div>

        {error && (
          <p className="mt-1 text-xs text-red-500">{error}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input, type InputProps };
