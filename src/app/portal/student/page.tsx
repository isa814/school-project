import Link from "next/link";
import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { getCurrentTerm } from "@/lib/services/academics";
import { myStudent, visibleScores } from "@/lib/services/student-portal";
import { attendanceRate } from "@/lib/services/attendance";
import { announcementsFor, notificationsFor, markNotificationsRead } from "@/lib/services/communications";
import { PageHeader } from "@/components/shared/PageHeader";
import { Flash } from "@/components/shared/Flash";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle, Badge, Notice } from "@/components/ui";
import { formatDate, formatKobo } from "@/lib/utils";
import { Percent, Bell, Wallet, GraduationCap } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StudentDashboard({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  const user = await requireRole("STUDENT");
  const student = await myStudent(user.id);
  if (!student) return <Notice tone="error">Your student profile is not linked to this account. Contact the school office.</Notice>;
  const term = await getCurrentTerm();
  const DAY = new Date(Date.now() + 60 * 60 * 1000).getUTCDay(); // Africa/Lagos is UTC+1, no DST
  const [att, scores, invoice, timetable, announcements, notifications, assignments] = await Promise.all([
    attendanceRate(student.id, term.id),
    visibleScores(student.id, term.id),
    db.invoice.findUnique({ where: { studentId_termId: { studentId: student.id, termId: term.id } } }),
    db.timetableEntry.findMany({ where: { classId: student.classId, sectionId: student.sectionId, dayOfWeek: DAY >= 1 && DAY <= 5 ? DAY : 1 }, include: { subject: true, teacher: true }, orderBy: { period: "asc" } }),
    announcementsFor(user, 5),
    notificationsFor(user.id, 5),
    db.material.findMany({ where: { classId: student.classId, kind: "ASSIGNMENT", dueDate: { gte: new Date() } }, include: { subject: true }, orderBy: { dueDate: "asc" }, take: 4 }),
  ]);
  const avg = scores.length ? Math.round((scores.reduce((s, x) => s + x.total, 0) / scores.length) * 10) / 10 : null;
  const balance = invoice ? invoice.totalKobo - invoice.paidKobo : 0;
  await markNotificationsRead(user.id).catch(() => undefined);

  return (
    <>
      <PageHeader eyebrow={`${student.class.name} ${student.section.name} · ${term.name}`} title={`Hello, ${student.firstName}`} description="Your timetable, attendance, results and fees in one place." />
      <Flash ok={searchParams.ok} err={searchParams.err} />

      {balance > 0 && (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-gold/50 bg-gold-soft p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-navy-deep">Outstanding fees: {formatKobo(balance)}</p>
            <p className="text-sm text-slate-700">Pay securely online with a card, bank transfer or USSD.</p>
          </div>
          <Link href="/portal/student/fees" className="focus-ring inline-flex h-10 items-center justify-center rounded-xl bg-navy px-4 text-sm font-semibold text-white hover:bg-navy-deep">Pay fees</Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Attendance this term" value={`${att.rate}%`} icon={Percent} hint={`${att.attended} of ${att.total} days`} />
        <StatCard label="Average (approved)" value={avg !== null ? `${avg}%` : "—"} icon={GraduationCap} hint={`${scores.length} subjects`} />
        <StatCard label="Fee balance" value={formatKobo(balance)} icon={Wallet} hint={invoice ? invoice.status.toLowerCase() : "no invoice yet"} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle>Today&apos;s timetable</CardTitle></CardHeader>
          <CardContent>
            {timetable.length === 0 ? <p className="text-sm text-slate-500">No lessons today.</p> : (
              <ul className="divide-y divide-navy/5">
                {timetable.map((t) => (
                  <li key={t.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
                    <span className="font-semibold text-navy-deep">{t.subject.name}</span>
                    <span className="text-slate-600">{t.startTime}–{t.endTime} · {t.teacher.firstName} {t.teacher.lastName}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Assignments due</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {assignments.map((a) => <li key={a.id}><p className="font-semibold text-navy-deep">{a.title}</p><p className="text-slate-600">{a.subject.name} · due {formatDate(a.dueDate)}</p></li>)}
              {assignments.length === 0 && <li className="text-slate-500">No upcoming assignments.</li>}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Latest results</CardTitle></CardHeader>
          <CardContent>
            {scores.length === 0 ? <p className="text-sm text-slate-500">Results appear here once the school approves them.</p> : (
              <ul className="divide-y divide-navy/5 text-sm">
                {scores.slice(0, 6).map((s) => (
                  <li key={s.id} className="flex justify-between py-2"><span>{s.subject.name}</span><span className="font-semibold">{s.total} · {s.grade}</span></li>
                ))}
              </ul>
            )}
            <Link href="/portal/student/results" className="focus-ring mt-3 inline-block rounded text-sm font-semibold text-navy hover:underline">All results →</Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Announcements</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-4 text-sm">
              {announcements.map((a) => <li key={a.id}><p className="font-semibold text-navy-deep">{a.title}</p><p className="text-slate-600">{a.body}</p><p className="text-xs text-slate-500">{formatDate(a.publishedAt)}</p></li>)}
              {announcements.length === 0 && <li className="text-slate-500">No announcements.</li>}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-4 w-4" aria-hidden /> Notifications</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {notifications.map((n) => <li key={n.id} className="flex flex-wrap items-center justify-between gap-2"><span><strong>{n.title}:</strong> {n.body}</span> {!n.readAt && <Badge tone="sky">new</Badge>}</li>)}
            {notifications.length === 0 && <li className="text-slate-500">You are all caught up.</li>}
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
