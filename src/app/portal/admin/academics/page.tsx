import { requireAdminPermission } from "@/lib/session";
import { db } from "@/lib/db";
import { createClassAction, createSubjectAction, setCurrentTermAction } from "@/app/actions/admin";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Input, Label, Select } from "@/components/ui";
import { PageHeader } from "@/components/shared/PageHeader";
import { Flash } from "@/components/shared/Flash";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
const DAYS = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default async function AcademicsPage({ searchParams }: { searchParams: { ok?: string; err?: string; classId?: string } }) {
  await requireAdminPermission("academics:write");
  const [sessions, classes, departments, subjects] = await Promise.all([
    db.academicSession.findMany({ include: { terms: { orderBy: { startDate: "asc" } } }, orderBy: { startDate: "desc" } }),
    db.class.findMany({ include: { sections: true, _count: { select: { students: true } } }, orderBy: { sortOrder: "asc" } }),
    db.department.findMany({ orderBy: { name: "asc" } }),
    db.subject.findMany({ include: { department: true }, orderBy: { name: "asc" } }),
  ]);
  const selectedClass = classes.find((c) => c.id === searchParams.classId) ?? classes[0];
  const timetable = selectedClass
    ? await db.timetableEntry.findMany({ where: { classId: selectedClass.id }, include: { subject: true, teacher: true, section: true }, orderBy: [{ dayOfWeek: "asc" }, { period: "asc" }] })
    : [];

  return (
    <>
      <PageHeader title="Academics" description="Sessions and terms, classes and arms, subjects, and the timetable." />
      <Flash ok={searchParams.ok} err={searchParams.err} />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Sessions and terms</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            {sessions.map((s) => (
              <div key={s.id}>
                <p className="font-semibold text-navy-deep">{s.name} {s.isCurrent && <Badge tone="green">current</Badge>}</p>
                <ul className="mt-2 divide-y divide-navy/5 text-sm">
                  {s.terms.map((t) => (
                    <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <span>{t.name} <span className="text-slate-500">({formatDate(t.startDate)} – {formatDate(t.endDate)})</span> {t.isLocked && <Badge tone="slate">locked</Badge>}</span>
                      {t.isCurrent ? <Badge tone="green">current term</Badge> : (
                        <form action={setCurrentTermAction}><input type="hidden" name="termId" value={t.id} /><Button type="submit" size="sm" variant="outline">Make current</Button></form>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Add a class</CardTitle></CardHeader>
            <CardContent>
              <form action={createClassAction} className="grid gap-4 sm:grid-cols-3">
                <div><Label htmlFor="name">Class name</Label><Input id="name" name="name" placeholder="JSS1" required /></div>
                <div><Label htmlFor="level">Level</Label><Select id="level" name="level" defaultValue="JUNIOR"><option value="NURSERY">Nursery</option><option value="PRIMARY">Primary</option><option value="JUNIOR">Junior secondary</option><option value="SENIOR">Senior secondary</option></Select></div>
                <div className="flex items-end"><Button type="submit" variant="outline">Create (arms A and B)</Button></div>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Add a subject</CardTitle></CardHeader>
            <CardContent>
              <form action={createSubjectAction} className="grid gap-4 sm:grid-cols-3">
                <div><Label htmlFor="sname">Subject</Label><Input id="sname" name="name" required /></div>
                <div><Label htmlFor="code">Code</Label><Input id="code" name="code" placeholder="FRN" /></div>
                <div><Label htmlFor="departmentId">Department</Label><Select id="departmentId" name="departmentId" defaultValue=""><option value="">None</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select></div>
                <div className="sm:col-span-3"><Button type="submit" variant="outline">Add subject</Button></div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Classes and arms</CardTitle></CardHeader>
          <CardContent>
            <ul className="grid gap-3 sm:grid-cols-2">
              {classes.map((c) => (
                <li key={c.id} className="rounded-xl border border-navy/10 p-4">
                  <p className="font-semibold text-navy-deep">{c.name}</p>
                  <p className="text-sm text-slate-600">{c.sections.map((s) => `${c.name} ${s.name}`).join(" · ")} · {c._count.students} students</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Subjects</CardTitle></CardHeader>
          <CardContent>
            <ul className="grid gap-2 text-sm sm:grid-cols-2">
              {subjects.map((s) => <li key={s.id} className="flex justify-between rounded-lg bg-sky-soft/50 px-3 py-2"><span className="font-medium">{s.name}</span><span className="text-slate-500">{s.department?.name ?? "—"}</span></li>)}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Timetable</CardTitle>
          <form method="get" className="mt-2 flex items-end gap-3">
            <div><Label htmlFor="tclass">Class</Label><Select id="tclass" name="classId" defaultValue={selectedClass?.id} className="w-44">{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></div>
            <Button type="submit" variant="outline" size="sm">Show</Button>
          </form>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500"><tr><th className="py-2 pr-4">Day</th><th className="pr-4">Period</th><th className="pr-4">Arm</th><th className="pr-4">Subject</th><th>Teacher</th></tr></thead>
              <tbody className="divide-y divide-navy/5">
                {timetable.slice(0, 60).map((t) => (
                  <tr key={t.id}><td className="py-2 pr-4">{DAYS[t.dayOfWeek]}</td><td className="pr-4">{t.period} ({t.startTime})</td><td className="pr-4">{t.section.name}</td><td className="pr-4 font-medium">{t.subject.name}</td><td>{t.teacher.firstName} {t.teacher.lastName}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-500">Read-only in this version. Timetable editing is planned for Phase 2.</p>
        </CardContent>
      </Card>
    </>
  );
}
