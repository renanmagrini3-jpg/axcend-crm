import { cn } from "@/lib/cn";

type SkeletonVariant = "text" | "circle" | "rect";

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  className?: string;
}

const variantStyles: Record<SkeletonVariant, string> = {
  text: "h-4 w-full rounded-md",
  circle: "h-10 w-10 rounded-full",
  rect: "h-32 w-full rounded-xl",
};

function Skeleton({
  variant = "text",
  width,
  height,
  className,
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-[var(--bg-elevated)]",
        variantStyles[variant],
        className,
      )}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export { Skeleton, type SkeletonProps };
