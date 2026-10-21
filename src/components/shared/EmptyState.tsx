import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

export function EmptyState({ title, description, icon: Icon = Inbox }: { title: string; description?: string; icon?: LucideIcon }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-navy/25 bg-white px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-soft text-navy">
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <p className="font-semibold text-navy-deep">{title}</p>
      {description && <p className="max-w-sm text-sm text-slate-600">{description}</p>}
    </div>
  );
}
