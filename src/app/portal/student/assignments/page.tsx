import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { myStudent } from "@/lib/services/student-portal";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent, CardHeader, CardTitle, Badge, Notice } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AssignmentsPage() {
  const user = await requireRole("STUDENT");
  const student = await myStudent(user.id);
  if (!student) return <Notice tone="error">Your student profile is not linked to this account.</Notice>;
  const items = await db.material.findMany({ where: { classId: student.classId }, include: { subject: true }, orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }] });
  const now = Date.now();
  const assignments = items.filter((i) => i.kind === "ASSIGNMENT");
  const materials = items.filter((i) => i.kind !== "ASSIGNMENT");

  return (
    <>
      <PageHeader eyebrow={`${student.class.name}`} title="Assignments & materials" description="Work set by your subject teachers, with due dates and any linked resources." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Assignments</CardTitle></CardHeader>
          <CardContent>
            {assignments.length === 0 ? <EmptyState title="No assignments yet" description="Assignments your teachers post will appear here." /> : (
              <ul className="divide-y divide-navy/5">
                {assignments.map((a) => {
                  const overdue = a.dueDate ? a.dueDate.getTime() < now : false;
                  return (
                    <li key={a.id} className="py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-navy-deep">{a.title}</p>
                        {a.dueDate ? <Badge tone={overdue ? "slate" : "amber"}>{overdue ? "Closed" : "Due"} {formatDate(a.dueDate)}</Badge> : <Badge tone="slate">No due date</Badge>}
                      </div>
                      <p className="text-sm text-slate-600">{a.subject.name}{a.description ? ` · ${a.description}` : ""}</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Study materials</CardTitle></CardHeader>
          <CardContent>
            {materials.length === 0 ? <EmptyState title="No materials yet" description="Notes and resources from your teachers will appear here." /> : (
              <ul className="divide-y divide-navy/5">
                {materials.map((m) => (
                  <li key={m.id} className="py-3 text-sm">
                    <p className="font-semibold text-navy-deep">{m.title}</p>
                    <p className="text-slate-600">{m.subject.name}{m.fileName ? ` · ${m.fileName}` : ""}</p>
                    {m.url && /^https?:\/\//.test(m.url) && <a href={m.url} target="_blank" rel="noopener noreferrer" className="focus-ring rounded text-navy hover:underline">Open resource</a>}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
