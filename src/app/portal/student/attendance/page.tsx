import { requireRole } from "@/lib/session";
import { getCurrentTerm } from "@/lib/services/academics";
import { myStudent } from "@/lib/services/student-portal";
import { attendanceRate } from "@/lib/services/attendance";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle, Notice } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { Percent, CalendarCheck, CalendarX } from "lucide-react";

export const dynamic = "force-dynamic";

const CELL: Record<string, string> = {
  PRESENT: "bg-emerald-500",
  LATE: "bg-amber-400",
  EXCUSED: "bg-sky-400",
  ABSENT: "bg-red-500",
};
const LABEL: Record<string, string> = { PRESENT: "Present", LATE: "Late", EXCUSED: "Excused", ABSENT: "Absent" };

/** Monday-start of the ISO week containing d (UTC). */
function mondayOf(d: Date): Date {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = x.getUTCDay() || 7;
  x.setUTCDate(x.getUTCDate() - (day - 1));
  return x;
}

export default async function AttendancePage() {
  const user = await requireRole("STUDENT");
  const student = await myStudent(user.id);
  if (!student) return <Notice tone="error">Your student profile is not linked to this account.</Notice>;
  const term = await getCurrentTerm();
  const att = await attendanceRate(student.id, term.id);

  const byDate = new Map<string, string>();
  for (const r of att.rows) byDate.set(r.date.toISOString().slice(0, 10), r.status);

  const weeks: { monday: Date; days: { iso: string; status: string | null }[] }[] = [];
  if (att.rows.length > 0) {
    const first = mondayOf(new Date(Math.min(...att.rows.map((r) => r.date.getTime()))));
    const last = mondayOf(new Date(Math.max(...att.rows.map((r) => r.date.getTime()))));
    for (let m = new Date(first); m <= last; m = new Date(m.getTime() + 7 * 86400000)) {
      const days = [0, 1, 2, 3, 4].map((i) => {
        const d = new Date(m.getTime() + i * 86400000);
        const iso = d.toISOString().slice(0, 10);
        return { iso, status: byDate.get(iso) ?? null };
      });
      weeks.push({ monday: new Date(m), days });
    }
  }
  const recent = [...att.rows].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);

  return (
    <>
      <PageHeader eyebrow={term.name} title="Attendance" description="Daily register for your current term. Late and excused days are shown in their own colours." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Attendance rate" value={`${att.rate}%`} icon={Percent} hint={`${att.total} school days recorded`} />
        <StatCard label="Days present or late" value={att.attended} icon={CalendarCheck} />
        <StatCard label="Days absent" value={att.absent} icon={CalendarX} />
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Register by week</CardTitle></CardHeader>
        <CardContent>
          {weeks.length === 0 ? <p className="text-sm text-slate-500">No attendance has been recorded this term yet.</p> : (
            <div className="space-y-2 overflow-x-auto">
              <div className="grid min-w-[420px] grid-cols-[120px_repeat(5,1fr)] gap-2 text-xs font-semibold text-slate-500">
                <span>Week of</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span>
              </div>
              {weeks.map((w) => (
                <div key={w.monday.toISOString()} className="grid min-w-[420px] grid-cols-[120px_repeat(5,1fr)] items-center gap-2">
                  <span className="text-xs text-slate-600">{formatDate(w.monday)}</span>
                  {w.days.map((d) => (
                    <span key={d.iso} title={d.status ? `${formatDate(d.iso)}: ${LABEL[d.status]}` : `${formatDate(d.iso)}: no record`}
                      className={`h-8 rounded-md ${d.status ? CELL[d.status] : "bg-slate-100"}`} />
                  ))}
                </div>
              ))}
              <ul className="flex flex-wrap gap-4 pt-3 text-xs text-slate-600">
                {Object.entries(LABEL).map(([k, v]) => (
                  <li key={k} className="flex items-center gap-2"><span className={`h-3 w-3 rounded ${CELL[k]}`} aria-hidden />{v}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader><CardTitle>Last 10 entries</CardTitle></CardHeader>
        <CardContent>
          <ul className="divide-y divide-navy/5 text-sm">
            {recent.map((r) => <li key={r.date.toISOString()} className="flex justify-between py-2"><span>{formatDate(r.date)}</span><span className="font-medium">{LABEL[r.status]}</span></li>)}
            {recent.length === 0 && <li className="py-2 text-slate-500">Nothing yet.</li>}
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
