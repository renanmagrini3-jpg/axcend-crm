import Image from "next/image";
import { cn } from "@/lib/cn";

type AvatarSize = "sm" | "md" | "lg";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  className?: string;
}

const sizeMap: Record<AvatarSize, number> = {
  sm: 32,
  md: 40,
  lg: 48,
};

const sizeStyles: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function Avatar({ src, alt, name, size = "md", className }: AvatarProps) {
  const initials = name ? getInitials(name) : "?";
  const px = sizeMap[size];

  if (src) {
    return (
      <Image
        src={src}
        alt={alt ?? name ?? "Avatar"}
        width={px}
        height={px}
        className={cn(
          "shrink-0 rounded-full object-cover",
          sizeStyles[size],
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-orange-500/15 font-medium text-orange-500",
        sizeStyles[size],
        className,
      )}
      role="img"
      aria-label={alt ?? name ?? "Avatar"}
    >
      {initials}
    </div>
  );
}

export { Avatar, type AvatarProps };
