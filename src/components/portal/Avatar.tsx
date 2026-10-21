import Image from "next/image";
import { cn } from "@/lib/utils";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

/** A user's photo, or their initials on a placeholder tile until they upload one. */
export function Avatar({ name, src, size = 56, className }: { name: string; src?: string | null; size?: number; className?: string }) {
  const style = { width: size, height: size };
  if (src) {
    return (
      <span className={cn("relative inline-block shrink-0 overflow-hidden rounded-2xl ring-2 ring-white shadow-card", className)} style={style}>
        <Image src={src} alt={`Photo of ${name}`} width={size} height={size} unoptimized className="h-full w-full object-cover" />
      </span>
    );
  }
  return (
    <span
      role="img"
      aria-label={`${name} has no photo yet`}
      className={cn("flex shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-navy/25 bg-sky-soft font-display font-semibold text-navy-deep", className)}
      style={{ ...style, fontSize: Math.max(12, size * 0.34) }}
    >
      {initials(name)}
    </span>
  );
}
