import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { getCurrentTerm, teacherScope } from "@/lib/services/academics";
import { attendanceRate } from "@/lib/services/attendance";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { CountBars } from "@/components/charts/Charts";
import { EmptyState } from "@/components/shared/EmptyState";

export const dynamic = "force-dynamic";
type Row = { id: string; name: string; cls: string; avg: number | null; att: number; subjects: number };

export default async function MyStudentsPage() {
  const user = await requireRole("TEACHER");
  const staff = await db.staff.findUniqueOrThrow({ where: { userId: user.id } });
  const term = await getCurrentTerm();
  const scope = await teacherScope(staff.id);
  const students = await db.student.findMany({ where: { classId: { in: scope.classIds }, deletedAt: null, status: "ACTIVE" }, include: { class: true, section: true }, orderBy: [{ class: { sortOrder: "asc" } }, { lastName: "asc" }] });
  const scores = await db.score.findMany({ where: { termId: term.id, status: { in: ["APPROVED", "LOCKED", "SUBMITTED"] }, studentId: { in: students.map((s) => s.id) } }, select: { studentId: true, total: true, subjectId: true } });
  const rows: Row[] = await Promise.all(students.map(async (s) => {
    const mine = scores.filter((x) => x.studentId === s.id);
    const att = await attendanceRate(s.id, term.id);
    return {
      id: s.id, name: `${s.firstName} ${s.lastName}`, cls: `${s.class.name} ${s.section.name}`,
      avg: mine.length ? Math.round((mine.reduce((a, b) => a + b.total, 0) / mine.length) * 10) / 10 : null,
      att: att.rate, subjects: new Set(mine.map((m) => m.subjectId)).size,
    };
  }));
  // Real class averages from this term's scores (no placeholder data).
  const classAverages = Array.from(
    rows.reduce((m, r) => {
      const cur = m.get(r.cls) ?? { sum: 0, n: 0 };
      if (r.avg !== null) { cur.sum += r.avg; cur.n += 1; }
      m.set(r.cls, cur);
      return m;
    }, new Map<string, { sum: number; n: number }>()),
  ).map(([name, v]) => ({ name, value: v.n ? Math.round((v.sum / v.n) * 10) / 10 : 0 }));

  const columns: Column<Row>[] = [
    { key: "name", header: "Student", cell: (r) => <span className="font-semibold text-navy-deep">{r.name}</span>, sortValue: (r) => r.name },
    { key: "cls", header: "Class", cell: (r) => r.cls, sortValue: (r) => r.cls },
    { key: "avg", header: "Average", cell: (r) => (r.avg === null ? "—" : `${r.avg}%`), sortValue: (r) => r.avg ?? -1 },
    { key: "subjects", header: "Subjects scored", cell: (r) => r.subjects, sortValue: (r) => r.subjects },
    { key: "att", header: "Attendance", cell: (r) => `${r.att}%`, sortValue: (r) => r.att },
  ];

  return (
    <>
      <PageHeader eyebrow={term.name} title="My students" description="Read-only performance for the classes you teach. Averages include submitted and approved scores." />
      {rows.length === 0 ? <EmptyState title="No students in your classes" /> : (
        <>
          <Card className="mb-6">
            <CardHeader><CardTitle>Average score by class (%)</CardTitle></CardHeader>
            <CardContent><CountBars data={classAverages} /></CardContent>
          </Card>
          <DataTable columns={columns} rows={rows} searchText={(r) => `${r.name} ${r.cls}`} searchPlaceholder="Search my students" />
        </>
      )}
    </>
  );
}
