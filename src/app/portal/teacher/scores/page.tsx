import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { getCurrentTerm, teacherScope, teacherTeachesSubject } from "@/lib/services/academics";
import { scoreSheet } from "@/lib/services/scores";
import { saveScoresAction, submitScoresAction } from "@/app/actions/teacher";
import { PageHeader } from "@/components/shared/PageHeader";
import { Flash } from "@/components/shared/Flash";
import { Button, Label, Select, Notice } from "@/components/ui";
import { ScoreGrid } from "@/components/teacher/ScoreGrid";
import { EmptyState } from "@/components/shared/EmptyState";

export const dynamic = "force-dynamic";

export default async function ScoresPage({ searchParams }: { searchParams: { classId?: string; subjectId?: string; ok?: string; err?: string } }) {
  const user = await requireRole("TEACHER");
  const staff = await db.staff.findUniqueOrThrow({ where: { userId: user.id } });
  const term = await getCurrentTerm();
  const scope = await teacherScope(staff.id);
  const classes = await db.class.findMany({ where: { id: { in: scope.classIds } }, orderBy: { sortOrder: "asc" } });
  const classId = classes.find((c) => c.id === searchParams.classId)?.id ?? classes[0]?.id;
  const subjectOptions = classId ? await db.subject.findMany({ where: { id: { in: Array.from(scope.subjectIdsByClass.get(classId) ?? []) } }, orderBy: { name: "asc" } }) : [];
  const subjectId = subjectOptions.find((s) => s.id === searchParams.subjectId)?.id ?? subjectOptions[0]?.id;
  const allowed = classId && subjectId ? await teacherTeachesSubject(staff.id, classId, subjectId) : false;
  const sheet = classId && subjectId && allowed ? await scoreSheet({ classId, subjectId, termId: term.id }) : [];
  const locked = sheet.some((r) => r.status === "APPROVED" || r.status === "LOCKED");
  const anySubmitted = sheet.some((r) => r.status === "SUBMITTED");
  const allSubmittedOrLocked = sheet.length > 0 && sheet.every((r) => r.status !== "DRAFT");

  return (
    <>
      <PageHeader eyebrow={term.name} title="Scores" description="Enter continuous assessment (out of 40) and exam (out of 60). Save as draft, then submit for the Principal's approval." />
      <Flash ok={searchParams.ok} err={searchParams.err} />

      <form method="get" className="mb-6 flex flex-wrap items-end gap-3">
        <div><Label htmlFor="classId">Class</Label><Select id="classId" name="classId" defaultValue={classId} className="w-44">{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></div>
        <div><Label htmlFor="subjectId">Subject</Label><Select id="subjectId" name="subjectId" defaultValue={subjectId} className="w-56">{subjectOptions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></div>
        <Button type="submit" variant="outline">Load sheet</Button>
      </form>

      {!classId && <EmptyState title="No classes yet" description="You have no class or subject assignments." />}
      {classId && subjectId && allowed && (
        <>
          {anySubmitted && <div className="mb-4"><Notice tone="info">Submitted scores are waiting for approval and can&apos;t be edited. The Principal can return them to you.</Notice></div>}
          {locked && <div className="mb-4"><Notice tone="info">Some scores are approved or locked and are read-only.</Notice></div>}
          <form action={saveScoresAction} className="space-y-4">
            <input type="hidden" name="classId" value={classId} />
            <input type="hidden" name="subjectId" value={subjectId} />
            <ScoreGrid rows={sheet} locked={false} />
            <div className="flex flex-wrap gap-3">
              <Button type="submit" variant="outline" disabled={allSubmittedOrLocked && sheet.length > 0}>Save draft</Button>
            </div>
          </form>
          <form action={submitScoresAction} className="mt-3">
            <input type="hidden" name="classId" value={classId} />
            <input type="hidden" name="subjectId" value={subjectId} />
            <Button type="submit" disabled={!sheet.some((r) => r.status === "DRAFT" && r.total !== null)}>Submit for approval</Button>
          </form>
        </>
      )}
      {classId && subjectId && !allowed && <Notice tone="error">You are not assigned to this subject for this class.</Notice>}
    </>
  );
}
