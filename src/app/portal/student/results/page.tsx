import Link from "next/link";
import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { getCurrentTerm } from "@/lib/services/academics";
import { myStudent, visibleScores } from "@/lib/services/student-portal";
import { classPosition } from "@/lib/services/students";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { TrendLine } from "@/components/charts/Charts";
import { Card, CardContent, CardHeader, CardTitle, Notice, Badge } from "@/components/ui";
import { Download, GraduationCap, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ResultsPage({ searchParams }: { searchParams: { termId?: string } }) {
  const user = await requireRole("STUDENT");
  const student = await myStudent(user.id);
  if (!student) return <Notice tone="error">Your student profile is not linked to this account.</Notice>;

  const current = await getCurrentTerm();
  const selectedId = searchParams.termId ?? current.id;
  const term = (await db.term.findUnique({ where: { id: selectedId } })) ?? current;

  // Terms with approved results for this student, oldest first, for the trend chart.
  const allApproved = await db.score.findMany({
    where: { studentId: student.id, status: { in: ["APPROVED", "LOCKED"] } },
    select: { termId: true, total: true, term: { select: { id: true, name: true, startDate: true } } },
  });
  const termMap = new Map<string, { name: string; start: number; sum: number; n: number }>();
  for (const s of allApproved) {
    const t = termMap.get(s.termId) ?? { name: s.term.name, start: s.term.startDate.getTime(), sum: 0, n: 0 };
    t.sum += s.total;
    t.n += 1;
    termMap.set(s.termId, t);
  }
  const trend = Array.from(termMap.values())
    .sort((a, b) => a.start - b.start)
    .map((t) => ({ name: t.name, average: Math.round((t.sum / t.n) * 10) / 10 }));
  const termOptions = await db.term.findMany({ where: { id: { in: Array.from(termMap.keys()) } }, orderBy: { startDate: "desc" } });

  const scores = await visibleScores(student.id, term.id);
  const avg = scores.length ? Math.round((scores.reduce((s, x) => s + x.total, 0) / scores.length) * 10) / 10 : null;
  const pos = scores.length ? await classPosition(student.id, term.id) : null;

  return (
    <>
      <PageHeader eyebrow={student.class.name} title="Results" description="Only results the school has approved are shown. Scores are out of 100." actions={
        scores.length > 0 ? (
          <a href={`/api/report-cards/${student.id}?termId=${term.id}`} className="focus-ring inline-flex h-10 items-center gap-2 rounded-xl bg-navy px-4 text-sm font-semibold text-white hover:bg-navy-deep">
            <Download className="h-4 w-4" aria-hidden /> Report card (PDF)
          </a>
        ) : undefined
      } />

      <nav aria-label="Choose term" className="mb-6 flex flex-wrap gap-2">
        {termOptions.length === 0 && <span className="text-sm text-slate-500">No approved terms yet.</span>}
        {termOptions.map((t) => (
          <Link key={t.id} href={`/portal/student/results?termId=${t.id}`} className={cn("focus-ring rounded-full border px-4 py-1.5 text-sm font-medium", t.id === term.id ? "border-navy bg-navy text-white" : "border-navy/20 bg-white text-navy hover:bg-sky-soft")}>{t.name}</Link>
        ))}
      </nav>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={`Average · ${term.name}`} value={avg !== null ? `${avg}%` : "—"} icon={GraduationCap} hint={`${scores.length} subjects`} />
        <StatCard label="Position in class" value={pos?.position ? `${pos.position} of ${pos.outOf}` : "—"} icon={Trophy} hint="Ranked on approved results" />
        <StatCard label="Subjects passed" value={`${scores.filter((s) => s.total >= 40).length}/${scores.length || 0}`} hint="Pass mark 40" />
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Subject results · {term.name}</CardTitle></CardHeader>
        <CardContent>
          {scores.length === 0 ? <EmptyState title="No approved results for this term" description="Your teachers have not yet had their score sheets approved." /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="border-b border-navy/10 text-xs uppercase tracking-wide text-slate-500">
                  <tr><th className="py-2">Subject</th><th className="py-2 text-right">CA (40)</th><th className="py-2 text-right">Exam (60)</th><th className="py-2 text-right">Total</th><th className="py-2">Grade</th><th className="py-2">Remark</th></tr>
                </thead>
                <tbody className="divide-y divide-navy/5">
                  {scores.map((s) => (
                    <tr key={s.id}>
                      <td className="py-2 font-medium text-navy-deep">{s.subject.name}</td>
                      <td className="py-2 text-right">{s.caScore}</td>
                      <td className="py-2 text-right">{s.examScore}</td>
                      <td className="py-2 text-right font-semibold">{s.total}</td>
                      <td className="py-2"><Badge tone={s.total >= 40 ? "green" : "red"}>{s.grade ?? "—"}</Badge></td>
                      <td className="py-2 text-slate-600">{s.remark ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {scores.some((s) => s.comment) && (
            <div className="mt-6 space-y-2 text-sm">
              <p className="font-semibold text-navy-deep">Teacher comments</p>
              {scores.filter((s) => s.comment).map((s) => <p key={s.id} className="text-slate-700"><strong>{s.subject.name}:</strong> {s.comment}</p>)}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader><CardTitle>Progress across terms</CardTitle></CardHeader>
        <CardContent>
          {trend.length < 2 ? <p className="text-sm text-slate-500">Your progress chart appears once two terms have approved results.</p> : <TrendLine data={trend} lines={[{ key: "average", label: "Term average" }]} />}
        </CardContent>
      </Card>
    </>
  );
}
