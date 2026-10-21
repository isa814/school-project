import { Moon, Sunrise } from "lucide-react";
import { todaysPrayers, hijriToday } from "@/lib/prayer";
import { cn } from "@/lib/utils";

/** Today's prayer times for Lagos, with the next prayer highlighted. Rendered on the server at each revalidation. */
export function PrayerTimes({ className }: { className?: string }) {
  const { rows, next, sunrise } = todaysPrayers();
  return (
    <section aria-labelledby="prayer-times-heading" className={cn("rounded-3xl border border-navy/10 bg-white p-6 shadow-card", className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-navy/70"><Moon className="h-3.5 w-3.5" aria-hidden /> Salah times · Lagos</p>
          <h2 id="prayer-times-heading" className="mt-1 font-display text-2xl font-semibold text-navy-deep">Today&apos;s prayers</h2>
        </div>
        <p className="text-sm text-slate-600">{hijriToday()}</p>
      </div>
      <ol className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {rows.map((r) => {
          const isNext = r.key === next;
          return (
            <li key={r.key} className={cn("rounded-2xl p-4 text-center transition-transform duration-300 hover:-translate-y-1", isNext ? "bg-gold text-navy-deep shadow-lg" : "bg-sky-soft text-navy-deep")}>
              <p className="font-display text-lg font-semibold">{r.label}</p>
              <p className={cn("text-xs", isNext ? "text-navy-deep/80" : "text-navy/70")} lang="ar">{r.arabic}</p>
              <p className="mt-2 font-semibold tabular-nums">{r.time}</p>
              {isNext && <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide">Next</p>}
            </li>
          );
        })}
      </ol>
      <p className="mt-4 flex items-center gap-2 text-xs text-slate-500"><Sunrise className="h-3.5 w-3.5" aria-hidden /> Sunrise {sunrise}. Times are approximate and set by the school for the school day.</p>
    </section>
  );
}
