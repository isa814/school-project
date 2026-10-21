import { requireAdminPermission } from "@/lib/session";
import { db } from "@/lib/db";
import { createStaffAction, assignSubjectAction } from "@/app/actions/admin";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Input, Label, Select } from "@/components/ui";
import { PageHeader } from "@/components/shared/PageHeader";
import { Flash } from "@/components/shared/Flash";
import { DataTable, type Column } from "@/components/shared/DataTable";

export const dynamic = "force-dynamic";

type StaffRow = { id: string; name: string; staffNo: string; dept: string; subjects: string; classes: number; email: string };

export default async function StaffPage({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  await requireAdminPermission("staff:write");
  const [staff, subjects, classes, sections] = await Promise.all([
    db.staff.findMany({ where: { deletedAt: null }, include: { user: true, department: true, assignments: { include: { subject: true, class: true } } }, orderBy: { lastName: "asc" } }),
    db.subject.findMany({ orderBy: { name: "asc" } }),
    db.class.findMany({ orderBy: { sortOrder: "asc" } }),
    db.section.findMany({ include: { class: true }, orderBy: [{ class: { sortOrder: "asc" } }, { name: "asc" }] }),
  ]);
  const teachers = staff.filter((s) => s.user.role === "TEACHER");
  const rows: StaffRow[] = staff.map((s) => ({
    id: s.id, name: `${s.firstName} ${s.lastName}`, staffNo: s.staffNo, dept: s.department?.name ?? "—",
    subjects: Array.from(new Set(s.assignments.map((a) => a.subject.name))).join(", ") || "None assigned",
    classes: new Set(s.assignments.map((a) => a.classId)).size, email: s.user.email,
  }));

  const columns: Column<StaffRow>[] = [
    { key: "staffNo", header: "Staff no.", cell: (r) => <span className="font-mono text-xs">{r.staffNo}</span>, sortValue: (r) => r.staffNo },
    { key: "name", header: "Name", cell: (r) => <span className="font-semibold text-navy-deep">{r.name}</span>, sortValue: (r) => r.name },
    { key: "email", header: "Login", cell: (r) => <span className="text-slate-600">{r.email}</span> },
    { key: "dept", header: "Department", cell: (r) => r.dept, sortValue: (r) => r.dept },
    { key: "subjects", header: "Subjects", cell: (r) => <span className="text-slate-700">{r.subjects}</span> },
    { key: "classes", header: "Classes", cell: (r) => <Badge tone="sky">{r.classes}</Badge>, sortValue: (r) => r.classes },
  ];

  return (
    <>
      <PageHeader title="Staff" description="Teachers and staff, their login accounts and subject assignments." />
      <Flash ok={searchParams.ok} err={searchParams.err} />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <DataTable columns={columns} rows={rows} searchText={(r) => `${r.name} ${r.staffNo} ${r.subjects}`} searchPlaceholder="Search staff or subjects" emptyTitle="No staff yet" />
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Add a teacher</CardTitle></CardHeader>
            <CardContent>
              <form action={createStaffAction} className="grid gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label htmlFor="firstName">First name</Label><Input id="firstName" name="firstName" required minLength={2} /></div>
                  <div><Label htmlFor="lastName">Last name</Label><Input id="lastName" name="lastName" required minLength={2} /></div>
                </div>
                <div><Label htmlFor="email">Login email</Label><Input id="email" name="email" type="email" required /></div>
                <div><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" type="tel" required minLength={10} /></div>
                <div><Label htmlFor="qualification">Qualification</Label><Input id="qualification" name="qualification" placeholder="B.Ed Mathematics" /></div>
                <Button type="submit">Create account</Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Assign a subject</CardTitle></CardHeader>
            <CardContent>
              <form action={assignSubjectAction} className="grid gap-4">
                <div><Label htmlFor="teacherId">Teacher</Label><Select id="teacherId" name="teacherId" required defaultValue=""><option value="" disabled>Choose</option>{teachers.map((t) => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}</Select></div>
                <div><Label htmlFor="subjectId">Subject</Label><Select id="subjectId" name="subjectId" required defaultValue=""><option value="" disabled>Choose</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></div>
                <div><Label htmlFor="classId">Class</Label><Select id="classId" name="classId" required defaultValue=""><option value="" disabled>Choose</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></div>
                <div><Label htmlFor="sectionId">Section (blank = all arms)</Label><Select id="sectionId" name="sectionId" defaultValue=""><option value="">All arms</option>{sections.map((s) => <option key={s.id} value={s.id}>{s.class.name} {s.name}</option>)}</Select></div>
                <Button type="submit" variant="outline">Save assignment</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
