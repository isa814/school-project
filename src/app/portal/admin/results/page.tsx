import { requireAdminPermission } from "@/lib/session";
import { getCurrentTerm, listClasses, listSubjects } from "@/lib/services/academics";
import { pendingSheets } from "@/lib/services/scores";
import { reviewScoresAction, lockTermAction } from "@/app/actions/admin";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Input } from "@/components/ui";
import { PageHeader } from "@/components/shared/PageHeader";
import { Flash } from "@/components/shared/Flash";
import { EmptyState } from "@/components/shared/EmptyState";

export const dynamic = "force-dynamic";

export default async function ResultsApprovalPage({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  await requireAdminPermission("results:approve");
  const term = await getCurrentTerm();
  const [sheets] = await Promise.all([pendingSheets(term.id), listClasses(), listSubjects()]);

  return (
    <>
      <PageHeader eyebrow={`${term.session.name} · ${term.name}`} title="Results approval" description="Review score sheets that teachers have submitted. Approve them to publish to students, or return them with a comment." />
      <Flash ok={searchParams.ok} err={searchParams.err} />

      {sheets.length === 0 ? (
        <EmptyState title="Nothing waiting for approval" description="When a teacher submits scores, the sheet appears here." />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {sheets.map((s) => (
            <Card key={`${s.classId}-${s.subjectId}`}>
              <CardHeader>
                <CardTitle>{s.subjectName}</CardTitle>
                <p className="text-sm text-slate-600">{s.className} · {s.count} scores submitted</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <Badge tone="amber">awaiting approval</Badge>
                <form action={reviewScoresAction} className="space-y-3">
                  <input type="hidden" name="classId" value={s.classId} />
                  <input type="hidden" name="subjectId" value={s.subjectId} />
                  <input type="hidden" name="termId" value={term.id} />
                  <Input name="comment" placeholder="Optional comment (required when returning)" aria-label="Comment" />
                  <div className="flex gap-2">
                    <Button type="submit" name="decision" value="APPROVE" size="sm">Approve</Button>
                    <Button type="submit" name="decision" value="RETURN" size="sm" variant="outline">Return to teacher</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="mt-8 border-gold/50">
        <CardHeader><CardTitle>Lock term</CardTitle></CardHeader>
        <CardContent>
          <p className="mb-4 max-w-2xl text-sm text-slate-600">Locking marks all approved results as final. Teachers cannot change them afterwards. Only lock once every class has been approved.</p>
          <form action={lockTermAction}>
            <input type="hidden" name="termId" value={term.id} />
            <Button type="submit" variant="gold" disabled={term.isLocked}>{term.isLocked ? "Term already locked" : `Lock ${term.name}`}</Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
