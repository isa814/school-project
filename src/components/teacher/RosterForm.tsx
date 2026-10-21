"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

type Status = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
const OPTIONS: { value: Status; label: string }[] = [
  { value: "PRESENT", label: "P" }, { value: "ABSENT", label: "A" }, { value: "LATE", label: "L" }, { value: "EXCUSED", label: "E" },
];

/** One-tap attendance grid with a "Mark all present" shortcut. Inputs are named status_<studentId>. */
export function RosterForm({ rows, disabled }: { rows: { id: string; name: string; admissionNo: string; section: string; status: Status | null }[]; disabled?: boolean }) {
  const [state, setState] = useState<Record<string, Status>>(() =>
    Object.fromEntries(rows.map((r) => [r.id, r.status ?? "PRESENT"])),
  );
  const counts = Object.values(state).reduce<Record<string, number>>((acc, s) => ({ ...acc, [s]: (acc[s] ?? 0) + 1 }), {});

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => setState(Object.fromEntries(rows.map((r) => [r.id, "PRESENT" as Status])))}>Mark all present</Button>
        <span className="text-slate-600">Present {counts.PRESENT ?? 0} · Absent {counts.ABSENT ?? 0} · Late {counts.LATE ?? 0} · Excused {counts.EXCUSED ?? 0}</span>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white shadow-card">
        <table className="min-w-full text-sm">
          <thead className="bg-sky-soft/50 text-left text-xs uppercase tracking-wide text-navy-deep">
            <tr><th className="px-4 py-3">Student</th><th className="px-4 py-3">Arm</th><th className="px-4 py-3">Status</th></tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2.5"><p className="font-semibold text-navy-deep">{r.name}</p><p className="text-xs text-slate-500">{r.admissionNo}</p></td>
                <td className="px-4 py-2.5">{r.section}</td>
                <td className="px-4 py-2.5">
                  <fieldset className="flex gap-1" disabled={disabled}>
                    <legend className="sr-only">Attendance for {r.name}</legend>
                    {OPTIONS.map((o) => (
                      <label key={o.value} className={`focus-within:ring-2 focus-within:ring-sky inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border text-sm font-semibold transition-colors ${state[r.id] === o.value ? "border-navy bg-navy text-white" : "border-navy/20 bg-white text-navy hover:bg-sky-soft"} ${disabled ? "cursor-not-allowed opacity-60" : ""}`} title={o.value.toLowerCase()}>
                        <input type="radio" className="sr-only" name={`status_${r.id}`} value={o.value} checked={state[r.id] === o.value} onChange={() => setState((s) => ({ ...s, [r.id]: o.value }))} />
                        {o.label}
                        <span className="sr-only">{o.value.toLowerCase()}</span>
                      </label>
                    ))}
                  </fieldset>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">P = present, A = absent, L = late, E = excused.</p>
    </div>
  );
}
