import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal, StarDivider as AnimatedStarDivider } from "@/components/public/SectionMotion";

/** A page section. Content fades up as it scrolls into view. */
export function Section({ id, className, children }: { id?: string; className?: string; children: ReactNode }) {
  return (
    <Reveal>
      <section id={id} className={cn("mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20", className)}>{children}</section>
    </Reveal>
  );
}

export function SectionTitle({ eyebrow, title, description, center = false }: { eyebrow?: string; title: string; description?: string; center?: boolean }) {
  return (
    <div className={cn("mb-10 max-w-2xl", center && "mx-auto text-center")}>
      {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy/70">{eyebrow}</p>}
      <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-navy-deep sm:text-4xl">{title}</h2>
      <span className={cn("mt-4 block h-1 w-14 rounded-full bg-gold", center && "mx-auto")} aria-hidden />
      {description && <p className="mt-3 text-base leading-relaxed text-slate-600">{description}</p>}
    </div>
  );
}

/** Subtle Islamic-inspired star pattern used as a divider. */
export function StarDivider() {
  return <AnimatedStarDivider />;
}
