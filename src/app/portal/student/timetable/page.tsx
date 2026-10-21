import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { myStudent } from "@/lib/services/student-portal";
import { weeklyGrid } from "@/lib/services/timetable";
import { TimetableGrid } from "@/components/shared/TimetableGrid";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, Notice } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function StudentTimetable() {
  const user = await requireRole("STUDENT");
  const student = await myStudent(user.id);
  if (!student) return <Notice tone="error">Your student profile is not linked to this account.</Notice>;
  const entries = await db.timetableEntry.findMany({
    where: { classId: student.classId, sectionId: student.sectionId },
    include: { subject: true, teacher: true },
    orderBy: [{ dayOfWeek: "asc" }, { period: "asc" }],
  });
  const grid = weeklyGrid(entries.map((e) => ({ dayOfWeek: e.dayOfWeek, period: e.period, startTime: e.startTime, endTime: e.endTime, label: e.subject.name })));
  return (
    <>
      <PageHeader eyebrow={`${student.class.name} ${student.section.name}`} title="Weekly timetable" description="Monday to Friday. Times are school-local (WAT)." />
      <Card>
        <CardContent className="overflow-x-auto pt-6">
          {grid.length === 0 ? <p className="text-sm text-slate-500">No timetable has been published for your class yet.</p> : <TimetableGrid grid={grid} />}
        </CardContent>
      </Card>
    </>
  );
}
