import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { getCurrentTerm, teacherCanMarkClass, teacherScope } from "@/lib/services/academics";
import { classRoster, isAttendanceDateOpen, startOfDayUTC } from "@/lib/services/attendance";
import { saveAttendanceAction } from "@/app/actions/teacher";
import { PageHeader } from "@/components/shared/PageHeader";
import { Flash } from "@/components/shared/Flash";
import { Button, Label, Select, Notice } from "@/components/ui";
import { RosterForm } from "@/components/teacher/RosterForm";
import { EmptyState } from "@/components/shared/EmptyState";

export const dynamic = "force-dynamic";

export default async function AttendancePage({ searchParams }: { searchParams: { classId?: string; sectionId?: string; date?: string; ok?: string; err?: string } }) {
  const user = await requireRole("TEACHER");
  const staff = await db.staff.findUniqueOrThrow({ where: { userId: user.id } });
  const term = await getCurrentTerm();
  const scope = await teacherScope(staff.id);
  const classes = await db.class.findMany({ where: { id: { in: scope.classIds } }, include: { sections: { orderBy: { name: "asc" } } }, orderBy: { sortOrder: "asc" } });
  const dateStr = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date ?? "") ? searchParams.date! : new Date().toISOString().slice(0, 10);
  const date = startOfDayUTC(dateStr);
  const classId = classes.find((c) => c.id === searchParams.classId)?.id ?? classes[0]?.id;
  const cls = classes.find((c) => c.id === classId);
  const sectionId = cls?.sections.find((s) => s.id === searchParams.sectionId)?.id ?? "";
  const allowed = classId ? await teacherCanMarkClass(staff.id, classId) : false;
  const open = isAttendanceDateOpen(date);
  const rows = classId && allowed ? await classRoster(classId, sectionId || null, date) : [];

  return (
    <>
      <PageHeader eyebrow={term.name} title="Attendance" description="Mark each student present, absent, late or excused. Teachers can edit today or the previous school day." />
      <Flash ok={searchParams.ok} err={searchParams.err} />

      <form method="get" className="mb-6 flex flex-wrap items-end gap-3">
        <div><Label htmlFor="classId">Class</Label><Select id="classId" name="classId" defaultValue={classId} className="w-44">{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></div>
        <div><Label htmlFor="sectionId">Arm</Label><Select id="sectionId" name="sectionId" defaultValue={sectionId} className="w-36"><option value="">Both arms</option>{cls?.sections.map((s) => <option key={s.id} value={s.id}>{cls.name} {s.name}</option>)}</Select></div>
        <div><Label htmlFor="date">Date</Label><input id="date" name="date" type="date" defaultValue={dateStr} className="focus-ring rounded-xl border border-navy/20 px-3 py-2.5 text-sm" /></div>
        <Button type="submit" variant="outline">Load class</Button>
      </form>

      {!classId && <EmptyState title="No classes assigned" description="Ask the admin to assign you to a subject or class." />}
      {classId && !allowed && <Notice tone="error">You do not teach this class.</Notice>}
      {classId && allowed && (
        <>
          {!open && <div className="mb-4"><Notice tone="info">This date is outside the editing window. Teachers can record attendance for today or yesterday only. Ask an admin to change older records.</Notice></div>}
          <form action={saveAttendanceAction} className="space-y-4">
            <input type="hidden" name="classId" value={classId} />
            <input type="hidden" name="sectionId" value={sectionId} />
            <input type="hidden" name="date" value={dateStr} />
            <RosterForm rows={rows} disabled={!open} />
            {open && <Button type="submit" size="lg">Save attendance</Button>}
          </form>
        </>
      )}
    </>
  );
}
