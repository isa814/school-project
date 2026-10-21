import Link from "next/link";
import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { getCurrentTerm, teacherScope } from "@/lib/services/academics";
import { announcementsFor } from "@/lib/services/communications";
import { startOfDayUTC } from "@/lib/services/attendance";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, Badge, Input, Label, Button } from "@/components/ui";
import { Flash } from "@/components/shared/Flash";
import { changePasswordAction } from "@/app/actions/student";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TeacherDashboard({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  const user = await requireRole("TEACHER");
  const staff = await db.staff.findUnique({ where: { userId: user.id } });
  if (!staff) return <p>Your teacher profile is not linked yet. Contact the school office.</p>;
  const DAY = new Date().getDay(); // 0 Sun..6 Sat
  const term = await getCurrentTerm();
  const scope = await teacherScope(staff.id);
  const today = startOfDayUTC(new Date());
  const classes = await db.class.findMany({ where: { id: { in: scope.classIds } }, include: { sections: true }, orderBy: { sortOrder: "asc" } });
  const assignments = await db.subjectAssignment.findMany({ where: { teacherId: staff.id }, include: { subject: true, class: true, section: true }, orderBy: [{ class: { sortOrder: "asc" } }] });
  const todayLessons = await db.timetableEntry.findMany({
    where: { teacherId: staff.id, dayOfWeek: DAY >= 1 && DAY <= 5 ? DAY : 1 },
    include: { subject: true, class: true, section: true },
    orderBy: { period: "asc" },
  });
  const attendanceToday = await db.attendance.groupBy({ by: ["studentId"], where: { date: today, student: { classId: { in: scope.classIds } } }, _count: { _all: true } });
  const submittedCount = await db.score.count({ where: { enteredById: staff.id, status: "SUBMITTED", termId: term.id } });
  const draftCount = await db.score.count({ where: { enteredById: staff.id, status: "DRAFT", termId: term.id } });
  const announcements = await announcementsFor(user, 4);
  const studentsInScope = await db.student.count({ where: { classId: { in: scope.classIds }, deletedAt: null, status: "ACTIVE" } });
  const attendanceTaken = attendanceToday.length > 0;

  return (
    <>
      <PageHeader eyebrow={`${term.session.name} · ${term.name}`} title={`Good day, ${staff.firstName}`} description="Your classes, lessons and pending tasks." />
      <Flash ok={searchParams.ok} err={searchParams.err} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="pt-6"><p className="text-sm text-slate-600">My students</p><p className="font-display text-3xl font-semibold text-navy-deep">{studentsInScope}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-slate-600">Scores submitted</p><p className="font-display text-3xl font-semibold text-navy-deep">{submittedCount}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-slate-600">Draft scores</p><p className="font-display text-3xl font-semibold text-navy-deep">{draftCount}</p></CardContent></Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Pending tasks</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Link href="/portal/teacher/attendance" className="flex items-center justify-between rounded-xl bg-sky-soft/60 px-4 py-3 hover:bg-sky-soft">
              <span>Take today&apos;s attendance</span>
              <Badge tone={attendanceTaken ? "green" : "amber"}>{attendanceTaken ? "recorded" : "not yet"}</Badge>
            </Link>
            <Link href="/portal/teacher/scores" className="flex items-center justify-between rounded-xl bg-sky-soft/60 px-4 py-3 hover:bg-sky-soft">
              <span>Enter and submit scores</span>
              <Badge tone={draftCount > 0 ? "amber" : "green"}>{draftCount > 0 ? `${draftCount} drafts` : "up to date"}</Badge>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Today&apos;s lessons</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {todayLessons.map((l) => <li key={l.id} className="flex justify-between gap-3"><span className="font-medium">{l.subject.name}</span><span className="text-slate-600">{l.class.name} {l.section.name} · {l.startTime}</span></li>)}
              {todayLessons.length === 0 && <li className="text-slate-500">No lessons scheduled today.</li>}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>My classes and subjects</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {classes.map((c) => <li key={c.id}><span className="font-semibold">{c.name}</span> <span className="text-slate-600">· {assignments.filter((a) => a.classId === c.id).map((a) => a.subject.name).join(", ") || "class teacher"}</span></li>)}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Announcements</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-4 text-sm">
              {announcements.map((a) => <li key={a.id}><p className="font-semibold text-navy-deep">{a.title}</p><p className="text-slate-600">{a.body}</p><p className="text-xs text-slate-500">{formatDate(a.publishedAt)}</p></li>)}
              {announcements.length === 0 && <li className="text-slate-500">No announcements.</li>}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Change password</CardTitle></CardHeader>
          <CardContent>
            <form action={changePasswordAction} className="grid gap-3">
              <div><Label htmlFor="current">Current password</Label><Input id="current" name="current" type="password" required /></div>
              <div><Label htmlFor="next">New password</Label><Input id="next" name="next" type="password" required minLength={8} /></div>
              <div><Label htmlFor="confirm">Confirm new password</Label><Input id="confirm" name="confirm" type="password" required minLength={8} /></div>
              <Button type="submit" variant="outline">Update password</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
