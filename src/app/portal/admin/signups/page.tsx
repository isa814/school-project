import { requireAdminPermission } from "@/lib/session";
import { db } from "@/lib/db";
import { listClasses } from "@/lib/services/academics";
import { reviewSignupAction } from "@/app/actions/signup";
import { PageHeader } from "@/components/shared/PageHeader";
import { Flash } from "@/components/shared/Flash";
import { OneTimeCredentials } from "@/components/shared/OneTimeCredentials";
import { readOneTimeCredentials } from "@/app/actions/cookies";
import { Card, CardContent, CardHeader, CardTitle, Badge, Input, Label, Select, SubmitButton, Button } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TONE = { PENDING: "amber", APPROVED: "green", REJECTED: "red" } as const;

export default async function SignupReviewPage({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  await requireAdminPermission("students:write");
  const [requests, classes, creds] = await Promise.all([
    db.signupRequest.findMany({ orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 100, include: { desiredClass: true } }),
    listClasses(),
    readOneTimeCredentials(),
  ]);
  const pending = requests.filter((r) => r.status === "PENDING").length;

  return (
    <>
      <PageHeader eyebrow="Students" title="Student sign-up requests" description={`${pending} request${pending === 1 ? "" : "s"} waiting for review. Approving creates the student record and activates the account the student chose.`} />
      <Flash ok={searchParams.ok} err={searchParams.err} />
      {creds && <OneTimeCredentials items={creds} />}

      {requests.length === 0 && <Card><CardContent className="pt-6 text-sm text-slate-600">No sign-up requests yet.</CardContent></Card>}

      <div className="space-y-5">
        {requests.map((r) => (
          <Card key={r.id}>
            <CardHeader className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>{r.firstName} {r.lastName}</CardTitle>
              <Badge tone={TONE[r.status]}>{r.status.toLowerCase()}</Badge>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <dl className="grid gap-3 sm:grid-cols-3">
                <div><dt className="text-xs uppercase text-slate-500">Email</dt><dd className="font-medium text-navy-deep">{r.email}</dd></div>
                <div><dt className="text-xs uppercase text-slate-500">Phone</dt><dd>{r.phone}</dd></div>
                <div><dt className="text-xs uppercase text-slate-500">Gender / DOB</dt><dd>{r.gender} · {r.dob ? formatDate(r.dob) : "not given"}</dd></div>
                <div><dt className="text-xs uppercase text-slate-500">Guardian</dt><dd>{r.guardianName} ({r.guardianRelationship}) · {r.guardianPhone}</dd></div>
                <div><dt className="text-xs uppercase text-slate-500">Applying for</dt><dd>{r.desiredClass?.name ?? "Not chosen"}</dd></div>
                <div><dt className="text-xs uppercase text-slate-500">Previous school</dt><dd>{r.previousSchool ?? "—"}</dd></div>
              </dl>
              {r.status === "PENDING" ? (
                <div className="grid gap-4 rounded-xl bg-sky-soft/60 p-4 lg:grid-cols-[1fr_1fr_2fr_auto_auto] lg:items-end">
                  <form action={reviewSignupAction} className="contents">
                    <input type="hidden" name="requestId" value={r.id} />
                    <input type="hidden" name="decision" value="APPROVE" />
                    <div><Label htmlFor={`cls-${r.id}`}>Class *</Label>
                      <Select id={`cls-${r.id}`} name="classId" required defaultValue={r.desiredClassId ?? ""}>
                        <option value="" disabled>Choose</option>
                        {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </Select>
                    </div>
                    <div><Label htmlFor={`sec-${r.id}`}>Section *</Label>
                      <Select id={`sec-${r.id}`} name="sectionId" required defaultValue="">
                        <option value="" disabled>Choose</option>
                        {classes.flatMap((c) => c.sections.map((s) => <option key={s.id} value={s.id}>{c.name} {s.name}</option>))}
                      </Select>
                    </div>
                    <div><Label htmlFor={`note-${r.id}`}>Note (optional)</Label><Input id={`note-${r.id}`} name="note" maxLength={300} /></div>
                    <SubmitButton pendingText="Approving…">Approve</SubmitButton>
                  </form>
                  <form action={reviewSignupAction}>
                    <input type="hidden" name="requestId" value={r.id} />
                    <input type="hidden" name="decision" value="REJECT" />
                    <Button type="submit" variant="danger">Reject</Button>
                  </form>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Reviewed {r.reviewedAt ? formatDate(r.reviewedAt) : ""}{r.reviewNote ? ` · ${r.reviewNote}` : ""}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
