import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPermission } from "@/lib/session";
import { can } from "@/lib/permissions";
import { db } from "@/lib/db";
import { studentProfile, classPosition } from "@/lib/services/students";
import { attendanceRate } from "@/lib/services/attendance";
import { getCurrentTerm } from "@/lib/services/academics";
import { updateStudentStatusAction, updateStudentFieldsAction, softDeleteStudentAction } from "@/app/actions/admin";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Input, Label, Select } from "@/components/ui";
import { PageHeader } from "@/components/shared/PageHeader";
import { Flash } from "@/components/shared/Flash";
import { formatDate, formatKobo } from "@/lib/utils";
import { CountBars } from "@/components/charts/Charts";

export const dynamic = "force-dynamic";
const TABS = ["profile", "guardian", "medical", "attendance", "results", "fees"] as const;

export default async function StudentProfilePage({ params, searchParams }: { params: { id: string }; searchParams: { tab?: string; ok?: string; err?: string } }) {
  const actor = await requireAdminPermission("students:read");
  const student = await studentProfile(params.id);
  if (!student) notFound();
  const tab = (TABS as readonly string[]).includes(searchParams.tab ?? "") ? searchParams.tab! : "profile";
  const term = await getCurrentTerm();
  const canWrite = can(actor, "students:write");
  const canSeeMedical = can(actor, "medical:read");
  const [att, pos, invoices, scores] = await Promise.all([
    attendanceRate(student.id, term.id),
    classPosition(student.id, term.id),
    db.invoice.findMany({ where: { studentId: student.id }, include: { term: true, payments: { orderBy: { createdAt: "desc" } } }, orderBy: { createdAt: "desc" } }),
    db.score.findMany({ where: { studentId: student.id, termId: term.id }, include: { subject: true }, orderBy: { subject: { name: "asc" } } }),
  ]);
  const attendanceByMonth = Object.entries(
    att.rows.reduce<Record<string, { total: number; ok: number }>>((acc, r) => {
      const key = r.date.toLocaleString("en-NG", { month: "short", timeZone: "UTC" });
      acc[key] = acc[key] ?? { total: 0, ok: 0 };
      acc[key].total += 1;
      if (r.status !== "ABSENT") acc[key].ok += 1;
      return acc;
    }, {}),
  ).map(([name, v]) => ({ name, value: Math.round((v.ok / v.total) * 100) }));
  const tabLink = (t: string) => `/portal/admin/students/${student.id}?tab=${t}`;

  return (
    <>
      <PageHeader eyebrow={student.admissionNo} title={`${student.firstName} ${student.lastName}`} description={`${student.class.name} ${student.section.name} · ${student.gender}`} actions={
        <Badge tone={student.status === "ACTIVE" ? "green" : "slate"}>{student.status.toLowerCase()}</Badge>
      } />
      <Flash ok={searchParams.ok} err={searchParams.err} />

      <nav aria-label="Student sections" className="mb-6 flex flex-wrap gap-2 border-b border-navy/10 pb-3">
        {TABS.filter((t) => t !== "medical" || canSeeMedical).map((t) => (
          <Link key={t} href={tabLink(t)} aria-current={tab === t ? "page" : undefined} className={`focus-ring rounded-lg px-3 py-2 text-sm font-semibold capitalize ${tab === t ? "bg-navy text-white" : "text-navy hover:bg-sky-soft"}`}>{t}</Link>
        ))}
      </nav>

      {tab === "profile" && (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
            <CardContent className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <p><span className="text-slate-500">Date of birth</span><br />{formatDate(student.dob)}</p>
              <p><span className="text-slate-500">Admitted</span><br />{formatDate(student.admissionDate)}</p>
              <p><span className="text-slate-500">Previous school</span><br />{student.previousSchool ?? "—"}</p>
              <p><span className="text-slate-500">Login email</span><br />{student.user.email}</p>
              <p><span className="text-slate-500">Last sign-in</span><br />{formatDate(student.user.lastLoginAt)}</p>
              <p><span className="text-slate-500">Class position ({term.name})</span><br />{pos.position ? `${pos.position} of ${pos.outOf}` : "No approved results yet"}</p>
            </CardContent>
          </Card>
          {canWrite && (
            <Card>
              <CardHeader><CardTitle>Edit profile</CardTitle></CardHeader>
              <CardContent>
                <form action={updateStudentFieldsAction} className="grid gap-4 sm:grid-cols-2">
                  <input type="hidden" name="studentId" value={student.id} />
                  <div><Label htmlFor="firstName">First name</Label><Input id="firstName" name="firstName" defaultValue={student.firstName} required /></div>
                  <div><Label htmlFor="lastName">Last name</Label><Input id="lastName" name="lastName" defaultValue={student.lastName} required /></div>
                  <div className="sm:col-span-2"><Label htmlFor="previousSchool">Previous school</Label><Input id="previousSchool" name="previousSchool" defaultValue={student.previousSchool ?? ""} /></div>
                  <div className="sm:col-span-2"><Button type="submit">Save changes</Button></div>
                </form>
              </CardContent>
            </Card>
          )}
          {canWrite && (
            <Card>
              <CardHeader><CardTitle>Status</CardTitle></CardHeader>
              <CardContent>
                <form action={updateStudentStatusAction} className="flex flex-wrap items-end gap-3">
                  <input type="hidden" name="studentId" value={student.id} />
                  <div><Label htmlFor="status">Change status</Label><Select id="status" name="status" defaultValue={student.status} className="w-48">
                    {["ACTIVE", "GRADUATED", "TRANSFERRED", "SUSPENDED", "WITHDRAWN"].map((s) => <option key={s} value={s}>{s.toLowerCase()}</option>)}</Select></div>
                  <Button type="submit" variant="outline">Update status</Button>
                </form>
              </CardContent>
            </Card>
          )}
          {can(actor, "users:manage") && (
            <Card>
              <CardHeader><CardTitle>Archive record</CardTitle></CardHeader>
              <CardContent>
                <p className="mb-3 text-sm text-slate-600">Soft-deletes the student. Records are kept for audit and can be restored by the super admin.</p>
                <form action={softDeleteStudentAction}><input type="hidden" name="studentId" value={student.id} /><Button type="submit" variant="danger" size="sm">Archive student</Button></form>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {tab === "guardian" && (
        <Card><CardHeader><CardTitle>Guardians</CardTitle></CardHeader><CardContent>
          <ul className="space-y-4">
            {student.guardians.map((g) => (
              <li key={g.id} className="rounded-xl border border-navy/10 p-4 text-sm">
                <p className="font-semibold text-navy-deep">{g.name} <span className="font-normal text-slate-500">({g.relationship}{g.isPrimary ? ", primary" : ""})</span></p>
                <p>{g.phone} · {g.email ?? "no email"}</p>
                <p className="text-slate-600">{g.address ?? "No address"}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-slate-600">Family access code: <span className="font-mono font-semibold">{student.familyAccessCode}</span></p>
        </CardContent></Card>
      )}

      {tab === "medical" && canSeeMedical && (
        <Card><CardHeader><CardTitle>Medical record</CardTitle></CardHeader><CardContent className="space-y-4">
          <p className="text-sm text-slate-600">Access to medical records is logged.</p>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div><dt className="text-slate-500">Blood group</dt><dd className="font-semibold">{student.medical?.bloodGroup ?? "—"}</dd></div>
            <div><dt className="text-slate-500">Allergies</dt><dd className="font-semibold">{student.medical?.allergies ?? "—"}</dd></div>
            <div><dt className="text-slate-500">Conditions</dt><dd className="font-semibold">{student.medical?.conditions ?? "—"}</dd></div>
            <div><dt className="text-slate-500">Emergency contact</dt><dd className="font-semibold">{student.medical?.emergencyContact ?? "—"}</dd></div>
          </dl>
        </CardContent></Card>
      )}

      {tab === "attendance" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <Card><CardHeader><CardTitle>Attendance · {term.name}</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
            <p className="font-display text-3xl font-semibold text-navy-deep">{att.rate}%</p>
            <p>{att.attended} attended · {att.absent} absent · {att.total} days recorded</p>
          </CardContent></Card>
          <Card><CardHeader><CardTitle>Monthly attendance (%)</CardTitle></CardHeader><CardContent>
            {attendanceByMonth.length ? <CountBars data={attendanceByMonth} /> : <p className="text-sm text-slate-500">No attendance recorded this term.</p>}
          </CardContent></Card>
        </div>
      )}

      {tab === "results" && (
        <Card><CardHeader><CardTitle>Results · {term.name}</CardTitle></CardHeader><CardContent>
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-500"><tr><th className="py-2">Subject</th><th>CA</th><th>Exam</th><th>Total</th><th>Grade</th><th>Status</th></tr></thead>
            <tbody className="divide-y divide-navy/5">
              {scores.map((s) => <tr key={s.id}><td className="py-2 font-medium">{s.subject.name}</td><td>{s.caScore}</td><td>{s.examScore}</td><td>{s.total}</td><td>{s.grade}</td><td><Badge tone={s.status === "APPROVED" || s.status === "LOCKED" ? "green" : "amber"}>{s.status.toLowerCase()}</Badge></td></tr>)}
            </tbody>
          </table>
          {scores.length === 0 && <p className="text-sm text-slate-500">No scores recorded for this term.</p>}
          <a className="focus-ring mt-4 inline-block rounded-lg font-semibold text-navy underline" href={`/api/report-cards/${student.id}`}>Download report card (PDF)</a>
        </CardContent></Card>
      )}

      {tab === "fees" && (
        <Card><CardHeader><CardTitle>Invoices and payments</CardTitle></CardHeader><CardContent className="space-y-6">
          {invoices.map((inv) => (
            <div key={inv.id} className="rounded-xl border border-navy/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-navy-deep">{inv.invoiceNo} · {inv.term.name}</p>
                <Badge tone={inv.status === "PAID" ? "green" : inv.status === "PARTIAL" ? "amber" : "red"}>{inv.status.toLowerCase()}</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-600">Billed {formatKobo(inv.totalKobo)} · Paid {formatKobo(inv.paidKobo)} · Balance {formatKobo(inv.totalKobo - inv.paidKobo)}</p>
              <Link href={`/portal/admin/fees/invoices/${inv.id}`} className="focus-ring mt-2 inline-block rounded text-sm font-semibold text-navy hover:underline">Open invoice →</Link>
            </div>
          ))}
          {invoices.length === 0 && <p className="text-sm text-slate-500">No invoices yet.</p>}
        </CardContent></Card>
      )}
    </>
  );
}
