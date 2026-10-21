"use client";

import { useMemo, useState } from "react";
import { CA_MAX, EXAM_MAX, gradeFor } from "@/lib/grading";

type Row = { id: string; name: string; admissionNo: string; section: string; ca: number | null; exam: number | null; status: string; comment: string | null };

/** Spreadsheet-style score entry with live totals and grades. Inputs: ca_<id>, exam_<id>. */
export function ScoreGrid({ rows, locked }: { rows: Row[]; locked: boolean }) {
  const [values, setValues] = useState<Record<string, { ca: string; exam: string }>>(() =>
    Object.fromEntries(rows.map((r) => [r.id, { ca: r.ca?.toString() ?? "", exam: r.exam?.toString() ?? "" }])),
  );
  const computed = useMemo(() => rows.map((r) => {
    const v = values[r.id];
    const ca = Math.min(CA_MAX, Math.max(0, Number(v?.ca) || 0));
    const exam = Math.min(EXAM_MAX, Math.max(0, Number(v?.exam) || 0));
    const total = ca + exam;
    const hasEntry = (v?.ca ?? "") !== "" || (v?.exam ?? "") !== "";
    return { id: r.id, total, grade: hasEntry ? gradeFor(total).grade : "—", remark: hasEntry ? gradeFor(total).remark : "" };
  }), [rows, values]);

  return (
    <div className="overflow-x-auto rounded-2xl border border-navy/10 bg-white shadow-card">
      <table className="min-w-full text-sm">
        <thead className="bg-sky-soft/50 text-left text-xs uppercase tracking-wide text-navy-deep">
          <tr>
            <th className="px-4 py-3">Student</th><th className="px-4 py-3">Arm</th>
            <th className="px-4 py-3">CA (max {CA_MAX})</th><th className="px-4 py-3">Exam (max {EXAM_MAX})</th>
            <th className="px-4 py-3">Total</th><th className="px-4 py-3">Grade</th><th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-navy/5">
          {rows.map((r) => {
            const c = computed.find((x) => x.id === r.id)!;
            const isLocked = locked || r.status === "SUBMITTED" || r.status === "APPROVED" || r.status === "LOCKED";
            return (
              <tr key={r.id}>
                <td className="px-4 py-2"><p className="font-semibold text-navy-deep">{r.name}</p><p className="text-xs text-slate-500">{r.admissionNo}</p></td>
                <td className="px-4 py-2">{r.section}</td>
                <td className="px-4 py-2">
                  <label className="sr-only" htmlFor={`ca_${r.id}`}>CA score for {r.name}</label>
                  <input id={`ca_${r.id}`} name={`ca_${r.id}`} type="number" inputMode="decimal" min={0} max={CA_MAX} step="0.5" disabled={isLocked}
                    value={values[r.id]?.ca ?? ""} onChange={(e) => setValues((v) => ({ ...v, [r.id]: { ...v[r.id], ca: e.target.value } }))}
                    className="focus-ring w-24 rounded-lg border border-navy/20 px-2 py-1.5 disabled:bg-slate-50 disabled:text-slate-500" />
                </td>
                <td className="px-4 py-2">
                  <label className="sr-only" htmlFor={`exam_${r.id}`}>Exam score for {r.name}</label>
                  <input id={`exam_${r.id}`} name={`exam_${r.id}`} type="number" inputMode="decimal" min={0} max={EXAM_MAX} step="0.5" disabled={isLocked}
                    value={values[r.id]?.exam ?? ""} onChange={(e) => setValues((v) => ({ ...v, [r.id]: { ...v[r.id], exam: e.target.value } }))}
                    className="focus-ring w-24 rounded-lg border border-navy/20 px-2 py-1.5 disabled:bg-slate-50 disabled:text-slate-500" />
                </td>
                <td className="px-4 py-2 font-semibold">{c.total}</td>
                <td className="px-4 py-2"><span className="font-semibold text-navy-deep">{c.grade}</span> <span className="text-xs text-slate-500">{c.remark}</span></td>
                <td className="px-4 py-2 text-xs">
                  <span className={`rounded-full px-2 py-0.5 font-semibold ${r.status === "DRAFT" ? "bg-slate-100 text-slate-700" : r.status === "SUBMITTED" ? "bg-gold-soft text-[#7a4f0c]" : "bg-emerald-50 text-emerald-800"}`}>{r.status.toLowerCase()}</span>
                  {r.comment && <p className="mt-1 text-slate-600">{r.comment}</p>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
