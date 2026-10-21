import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { weeklyGrid } from "@/lib/services/timetable";
import { TimetableGrid } from "@/components/shared/TimetableGrid";

export const dynamic = "force-dynamic";

export default async function TeacherTimetable() {
  const user = await requireRole("TEACHER");
  const staff = await db.staff.findUniqueOrThrow({ where: { userId: user.id } });
  const entries = await db.timetableEntry.findMany({ where: { teacherId: staff.id }, include: { subject: true, class: true, section: true } });
  const grid = weeklyGrid(entries.map((e) => ({ dayOfWeek: e.dayOfWeek, period: e.period, startTime: e.startTime, endTime: e.endTime, label: `${e.subject.name} · ${e.class.name} ${e.section.name}` })));
  return (
    <>
      <PageHeader title="My timetable" description="Your weekly teaching periods. Read-only." />
      <Card>
        <CardHeader><CardTitle>Week</CardTitle></CardHeader>
        <CardContent>
          <TimetableGrid grid={grid} />
        </CardContent>
      </Card>
    </>
  );
}
