import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, withText = true, href = "/", tone = "dark" }: { className?: string; withText?: boolean; href?: string | null; tone?: "dark" | "light" }) {
  const inner = (
    <>
      <Image src="/logo.png" alt="Ansar Ruhul Islam school crest" width={44} height={44} className="h-11 w-11 rounded-full bg-white object-contain" priority />
      {withText && (
        <span className={cn("leading-tight", tone === "light" ? "text-white" : "text-navy-deep")}>
          <span className="block font-display text-[15px] font-semibold tracking-tight">Ansar Ruhul Islam</span>
          <span className={cn("block text-[11px] uppercase tracking-[0.14em]", tone === "light" ? "text-sky" : "text-navy/70")}>Nursery · Primary · Secondary</span>
        </span>
      )}
    </>
  );
  if (!href) return <div className={cn("flex items-center gap-3", className)}>{inner}</div>;
  return <Link href={href} className={cn("focus-ring flex items-center gap-3 rounded-lg", className)} aria-label="Ansar Ruhul Islam home">{inner}</Link>;
}
