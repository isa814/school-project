import { cookies } from "next/headers";
import { requirePermission } from "@/lib/session";
import { db } from "@/lib/db";
import { getCurrentTerm } from "@/lib/services/academics";
import { visibleScores, myStudent } from "@/lib/services/student-portal";
import { attendanceRate } from "@/lib/services/attendance";
import { unlockGuardianViewAction, lockGuardianViewAction } from "@/app/actions/student";
import { GUARDIAN_COOKIE, verifyGuardianToken } from "@/lib/guardian-gate";
import { PageHeader } from "@/components/shared/PageHeader";
import { Flash } from "@/components/shared/Flash";
import { PayForm } from "@/components/student/PayButton";
import { Card, CardContent, CardHeader, CardTitle, Input, Label, SubmitButton, Button, Notice, Badge } from "@/components/ui";
import { formatKobo, formatDate } from "@/lib/utils";
import { ShieldCheck, Lock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function GuardianViewPage({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  const user = await requirePermission("pay:own");
  const student = await myStudent(user.id);
  if (!student) return <Notice tone="error">Your student profile is not linked to this account.</Notice>;

  const unlocked = verifyGuardianToken(cookies().get(GUARDIAN_COOKIE)?.value, student.id);

  if (!unlocked) {
    return (
      <>
        <PageHeader eyebrow="Parents & guardians" title="Guardian View" description="A parent or guardian can check results, attendance and fees using the 4-digit Guardian PIN the school gave you. Access lasts 30 minutes." />
        <Flash ok={searchParams.ok} err={searchParams.err} />
        <Card className="max-w-md">
          <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" aria-hidden /> Enter Guardian PIN</CardTitle></CardHeader>
          <CardContent>
            <form action={unlockGuardianViewAction} className="space-y-4">
              <div>
                <Label htmlFor="pin">Guardian PIN</Label>
                <Input id="pin" name="pin" inputMode="numeric" pattern="\d{4}" maxLength={4} autoComplete="off" required className="w-40 text-center text-lg tracking-[0.5em]" />
              </div>
              <SubmitButton pendingText="Checking…">Open Guardian View</SubmitButton>
            </form>
            <p className="mt-4 text-xs text-slate-500">Five wrong attempts lock the PIN for 15 minutes. Forgotten your PIN? Visit the school office. Parents do not need a separate login.</p>
          </CardContent>
        </Card>
      </>
    );
  }

  const term = await getCurrentTerm();
  const [scores, att, invoices] = await Promise.all([
    visibleScores(student.id, term.id),
    attendanceRate(student.id, term.id),
    db.invoice.findMany({ where: { studentId: student.id }, include: { term: true, payments: { where: { status: "SUCCESS" }, orderBy: { paidAt: "desc" } } }, orderBy: { term: { startDate: "desc" } } }),
  ]);
  const avg = scores.length ? Math.round((scores.reduce((s, x) => s + x.total, 0) / scores.length) * 10) / 10 : null;

  return (
    <>
      <PageHeader eyebrow="Guardian View" title={`${student.firstName} ${student.lastName}`} description={`${student.class.name} ${student.section.name} · ${term.name}`} actions={
        <form action={lockGuardianViewAction}>
          <Button variant="outline" type="submit"><Lock className="mr-2 h-4 w-4" aria-hidden /> Lock view</Button>
        </form>
      } />
      <Flash ok={searchParams.ok} err={searchParams.err} />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>This term at a glance</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>Attendance: <strong>{att.rate}%</strong> ({att.attended} of {att.total} days)</p>
            <p>Average (approved results): <strong>{avg !== null ? `${avg}%` : "not yet published"}</strong></p>
            <ul className="divide-y divide-navy/5">
              {scores.map((s) => <li key={s.id} className="flex justify-between py-2"><span>{s.subject.name}</span><span className="font-semibold">{s.total} · {s.grade}</span></li>)}
            </ul>
            {scores.length > 0 && <a href={`/api/report-cards/${student.id}?termId=${term.id}`} className="focus-ring inline-block rounded font-semibold text-navy hover:underline">Download report card (PDF)</a>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>School fees</CardTitle></CardHeader>
          <CardContent className="space-y-5 text-sm">
            {invoices.length === 0 && <p className="text-slate-500">No invoices yet.</p>}
            {invoices.map((inv) => {
              const due = inv.totalKobo - inv.paidKobo;
              return (
                <div key={inv.id} className="rounded-xl border border-navy/10 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-navy-deep">{inv.term.name}</p>
                    <Badge tone={inv.status === "PAID" ? "green" : inv.status === "PARTIAL" ? "amber" : "red"}>{inv.status.toLowerCase()}</Badge>
                  </div>
                  <p className="mt-1 text-slate-600">Billed {formatKobo(inv.totalKobo)} · paid {formatKobo(inv.paidKobo)} · balance {formatKobo(due)}</p>
                  {inv.payments.length > 0 && <p className="text-xs text-slate-500">Last payment {formatDate(inv.payments[0].paidAt)}</p>}
                  {due > 0 && <div className="mt-3"><PayForm invoiceId={inv.id} outstandingKobo={due} /></div>}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
      <p className="mt-6 text-xs text-slate-500">The Guardian View closes automatically after 30 minutes or when you choose Lock view.</p>
    </>
  );
}
