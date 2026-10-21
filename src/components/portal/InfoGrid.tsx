import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { cn } from "@/lib/utils";

/** Labelled key/value tiles used on profile pages. Values may be any node (badges, links). */
export function InfoGrid({ items, columns = "sm:grid-cols-2 xl:grid-cols-3" }: { items: [string, ReactNode][]; columns?: string }) {
  return (
    <dl className={cn("grid gap-3", columns)}>
      {items.map(([label, value]) => (
        <div key={label} className="rounded-xl border border-navy/10 bg-white p-4 transition-colors hover:border-sky hover:bg-sky-soft/40">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
          <dd className="mt-1 break-words text-sm font-medium text-navy-deep">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A titled profile card. */
export function ProfileCard({ title, icon, children, className }: { title: string; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">{icon}{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
