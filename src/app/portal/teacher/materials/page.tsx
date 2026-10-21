import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { uploadMaterialAction } from "@/app/actions/teacher";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Input, Label, Select, Textarea } from "@/components/ui";
import { PageHeader } from "@/components/shared/PageHeader";
import { Flash } from "@/components/shared/Flash";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MaterialsPage({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  const user = await requireRole("TEACHER");
  const staff = await db.staff.findUniqueOrThrow({ where: { userId: user.id } });
  const assignments = await db.subjectAssignment.findMany({ where: { teacherId: staff.id }, include: { subject: true, class: true }, orderBy: { class: { sortOrder: "asc" } } });
  const pairs = Array.from(new Map(assignments.map((a) => [`${a.classId}:${a.subjectId}`, a])).values());
  const materials = await db.material.findMany({ where: { createdById: user.id }, include: { subject: true }, orderBy: { createdAt: "desc" }, take: 20 });

  return (
    <>
      <PageHeader title="Assignments & materials" description="Share assignments with due dates, and notes or links for a class and subject." />
      <Flash ok={searchParams.ok} err={searchParams.err} />
      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <Card>
          <CardHeader><CardTitle>Post to a class</CardTitle></CardHeader>
          <CardContent>
            <form action={uploadMaterialAction} className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label htmlFor="pair">Class and subject</Label>
                  <Select id="pair" name="pair" required defaultValue="" className="w-full">
                    <option value="" disabled>Choose</option>
                    {pairs.map((p) => <option key={`${p.classId}:${p.subjectId}`} value={`${p.classId}:${p.subjectId}`}>{p.class.name} · {p.subject.name}</option>)}
                  </Select>
                </div>
                <div><Label htmlFor="kind">Type</Label><Select id="kind" name="kind" defaultValue="ASSIGNMENT"><option value="ASSIGNMENT">Assignment</option><option value="MATERIAL">Learning material</option></Select></div>
              </div>
              <div><Label htmlFor="title">Title *</Label><Input id="title" name="title" required minLength={3} /></div>
              <div><Label htmlFor="description">Instructions</Label><Textarea id="description" name="description" /></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label htmlFor="url">Link (optional)</Label><Input id="url" name="url" type="url" placeholder="https://" /></div>
                <div><Label htmlFor="dueDate">Due date</Label><Input id="dueDate" name="dueDate" type="date" /></div>
              </div>
              <Button type="submit">Post</Button>
            </form>
            <p className="mt-3 text-xs text-slate-500">The class and subject must be ones you teach; the server checks this. File uploads are planned for Phase 2.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recently posted</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y divide-navy/5">
              {materials.map((m) => (
                <li key={m.id} className="py-3">
                  <div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-navy-deep">{m.title}</p><Badge tone={m.kind === "ASSIGNMENT" ? "amber" : "sky"}>{m.kind.toLowerCase()}</Badge></div>
                  <p className="text-sm text-slate-600">{m.subject.name}{m.dueDate ? ` · due ${formatDate(m.dueDate)}` : ""}</p>
                </li>
              ))}
              {materials.length === 0 && <li className="py-3 text-sm text-slate-500">Nothing posted yet.</li>}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
