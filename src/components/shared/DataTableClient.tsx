"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown, Search } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Input } from "@/components/ui";

/** Serializable shapes only. The server (DataTable) pre-renders everything so no functions cross the boundary. */
export type ClientColumn = { key: string; header: string; className?: string; sortable: boolean };
export type ClientRow = { id: string; cells: Record<string, ReactNode>; sort: Record<string, string | number>; search: string };

export function DataTableClient({
  columns, rows, searchPlaceholder, hasSearch, pageSize, emptyTitle, emptyDescription,
}: {
  columns: ClientColumn[];
  rows: ClientRow[];
  searchPlaceholder: string;
  hasSearch: boolean;
  pageSize: number;
  emptyTitle: string;
  emptyDescription?: string;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = q && hasSearch ? rows.filter((r) => r.search.toLowerCase().includes(q)) : rows;
    if (sort) {
      const key = sort.key;
      list = [...list].sort((a, b) => {
        const av = a.sort[key] ?? "", bv = b.sort[key] ?? "";
        const r = av < bv ? -1 : av > bv ? 1 : 0;
        return sort.dir === "asc" ? r : -r;
      });
    }
    return list;
  }, [rows, query, hasSearch, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const slice = filtered.slice((current - 1) * pageSize, current * pageSize);

  function toggleSort(key: string) {
    setSort((s) => (s?.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  }

  return (
    <div className="rounded-2xl border border-navy/10 bg-white shadow-card">
      {hasSearch && (
        <div className="flex items-center gap-3 border-b border-navy/10 p-4">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <Input
              aria-label={searchPlaceholder}
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <span className="ml-auto text-xs text-slate-500">{filtered.length} result{filtered.length === 1 ? "" : "s"}</span>
        </div>
      )}
      {filtered.length === 0 ? (
        <div className="p-4"><EmptyState title={emptyTitle} description={emptyDescription} /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-navy/10 text-sm">
            <thead className="bg-sky-soft/50 text-left text-xs uppercase tracking-wide text-navy-deep">
              <tr>
                {columns.map((c) => (
                  <th key={c.key} scope="col" className={`px-4 py-3 font-semibold ${c.className ?? ""}`}>
                    {c.sortable ? (
                      <button type="button" onClick={() => toggleSort(c.key)} className="focus-ring inline-flex items-center gap-1 rounded">
                        {c.header}
                        {sort?.key === c.key ? (sort.dir === "asc" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />) : <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />}
                      </button>
                    ) : c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5">
              {slice.map((row) => (
                <tr key={row.id} className="hover:bg-sky-soft/40">
                  {columns.map((c) => (
                    <td key={c.key} className={`px-4 py-3 align-middle text-ink ${c.className ?? ""}`}>{row.cells[c.key]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {filtered.length > pageSize && (
        <div className="flex items-center justify-between gap-3 border-t border-navy/10 px-4 py-3 text-sm">
          <span className="text-slate-600">Page {current} of {pages}</span>
          <div className="flex gap-2">
            <button type="button" disabled={current <= 1} onClick={() => setPage(current - 1)} className="focus-ring rounded-lg border border-navy/20 px-3 py-1.5 disabled:opacity-40">Previous</button>
            <button type="button" disabled={current >= pages} onClick={() => setPage(current + 1)} className="focus-ring rounded-lg border border-navy/20 px-3 py-1.5 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
