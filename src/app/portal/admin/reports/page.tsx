import { requireAdminPermission } from "@/lib/session";
import { can } from "@/lib/permissions";
import { db } from "@/lib/db";
import { getCurrentTerm } from "@/lib/services/academics";
import { feeSummary } from "@/lib/services/fees";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";
import { PageHeader } from "@/components/shared/PageHeader";
import { CountBars, MoneyBars } from "@/components/charts/Charts";
import { formatKobo, percent } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const actor = await requireAdminPermission("reports:read");
  const term = await getCurrentTerm();
  const classes = await db.class.findMany({ orderBy: { sortOrder: "asc" }, include: { students: { where: { deletedAt: null } } } });
  const genders = await db.student.groupBy({ by: ["gender"], where: { deletedAt: null }, _count: { _all: true } });
  const statuses = await db.student.groupBy({ by: ["status"], where: { deletedAt: null }, _count: { _all: true } });
  const enrollment = classes.map((c) => ({ name: c.name, value: c.students.length }));
  const fees = await feeSummary(term.id);
  const feeByClass = await Promise.all(classes.map(async (c) => {
    const invs = await db.invoice.findMany({ where: { termId: term.id, student: { classId: c.id } }, select: { totalKobo: true, paidKobo: true } });
    return { name: c.name, collected: invs.reduce((s, i) => s + i.paidKobo, 0) / 100, outstanding: invs.reduce((s, i) => s + Math.max(0, i.totalKobo - i.paidKobo), 0) / 100 };
  }));
  const approved = await db.score.findMany({ where: { termId: term.id, status: { in: ["APPROVED", "LOCKED"] } }, select: { total: true, grade: true, student: { select: { class: { select: { name: true } } } } } });
  const passByClass = classes.map((c) => {
    const rows = approved.filter((s) => s.student.class.name === c.name);
    const pass = rows.filter((r) => r.grade && r.grade !== "F9").length;
    return { name: c.name, value: percent(pass, rows.length) };
  });
  const absentees = await db.attendance.groupBy({ by: ["studentId"], where: { termId: term.id, status: "ABSENT" }, _count: { _all: true }, orderBy: { _count: { studentId: "desc" } }, take: 5 });

  return (
    <>
      <PageHeader eyebrow={term.name} title="Reports & analytics" description="School-wide figures for the current term. Exports are CSV." actions={
        <>
          <a href="/api/exports/students" className="focus-ring inline-flex h-10 items-center rounded-xl border border-navy/20 bg-white px-4 text-sm font-semibold text-navy hover:bg-sky-soft">Students CSV</a>
          {can(actor, "fees:read") && <a href="/api/exports/outstanding-fees" className="focus-ring inline-flex h-10 items-center rounded-xl border border-navy/20 bg-white px-4 text-sm font-semibold text-navy hover:bg-sky-soft">Outstanding CSV</a>}
          {can(actor, "reports:finance") && <a href="/api/exports/payments" className="focus-ring inline-flex h-10 items-center rounded-xl border border-navy/20 bg-white px-4 text-sm font-semibold text-navy hover:bg-sky-soft">Payments CSV</a>}
        </>
      } />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Enrolment by class</CardTitle></CardHeader>
          <CardContent>
            <CountBars data={enrollment} />
            <ul className="mt-4 flex flex-wrap gap-2 text-sm">
              {genders.map((g) => <Badge key={g.gender} tone="sky">{g.gender}: {g._count._all}</Badge>)}
              {statuses.map((s) => <Badge key={s.status} tone="slate">{s.status.toLowerCase()}: {s._count._all}</Badge>)}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Fees by class · {term.name}</CardTitle></CardHeader>
          <CardContent>
            <MoneyBars data={feeByClass} />
            <p className="mt-3 text-sm text-slate-600">Total billed {formatKobo(fees.billed)} · collected {formatKobo(fees.collected)} · outstanding {formatKobo(fees.outstanding)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Pass rate by class (approved results, %)</CardTitle></CardHeader>
          <CardContent>
            {approved.length ? <CountBars data={passByClass} /> : <p className="py-10 text-center text-sm text-slate-500">No approved results this term yet.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Most absences this term</CardTitle></CardHeader>
          <CardContent>
            {absentees.length === 0 ? <p className="text-sm text-slate-500">No absences recorded.</p> : (
              <ul className="space-y-2 text-sm">
                {await Promise.all(absentees.map(async (a) => {
                  const st = await db.student.findUnique({ where: { id: a.studentId }, select: { firstName: true, lastName: true, admissionNo: true } });
                  return <li key={a.studentId} className="flex justify-between rounded-lg bg-sky-soft/50 px-3 py-2"><span className="font-medium">{st?.firstName} {st?.lastName} <span className="text-slate-500">({st?.admissionNo})</span></span><span>{a._count._all} absent</span></li>;
                }))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
