import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { getCurrentTerm } from "@/lib/services/academics";
import { myStudent } from "@/lib/services/student-portal";
import { attendanceRate } from "@/lib/services/attendance";
import { changePasswordAction } from "@/app/actions/student";
import { PageHeader } from "@/components/shared/PageHeader";
import { Flash } from "@/components/shared/Flash";
import { AvatarUpload } from "@/components/portal/AvatarUpload";
import { InfoGrid, ProfileCard } from "@/components/portal/InfoGrid";
import { PasswordForm } from "@/components/portal/PasswordForm";
import { Badge, Notice } from "@/components/ui";
import { formatDate, formatKobo } from "@/lib/utils";
import { UserRound, ShieldPlus, Users, HeartPulse, Wallet } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StudentProfile({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  const user = await requireRole("STUDENT");
  const student = await myStudent(user.id);
  if (!student) return <Notice tone="error">Your student profile is not linked to this account.</Notice>;
  const term = await getCurrentTerm();
  const [account, guardians, medical, att, invoices] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: user.id }, select: { email: true, lastLoginAt: true, createdAt: true, mustChangePassword: true } }),
    db.guardian.findMany({ where: { studentId: student.id }, orderBy: { isPrimary: "desc" } }),
    db.medicalRecord.findUnique({ where: { studentId: student.id } }),
    attendanceRate(student.id, term.id),
    db.invoice.findMany({ where: { studentId: student.id }, select: { totalKobo: true, paidKobo: true } }),
  ]);
  const balance = invoices.reduce((s, i) => s + (i.totalKobo - i.paidKobo), 0);

  return (
    <>
      <PageHeader eyebrow="My profile" title={`${student.firstName} ${student.lastName}`} description={`${student.class.name} ${student.section.name} · ${student.admissionNo}`} />
      <Flash ok={searchParams.ok} err={searchParams.err} />

      <div className="grid gap-6 xl:grid-cols-3">
        <ProfileCard title="Photo" icon={<UserRound className="h-4 w-4" aria-hidden />} className="xl:row-span-2">
          <AvatarUpload name={`${student.firstName} ${student.lastName}`} currentUrl={user.avatarUrl} />
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-sky-soft p-3"><p className="font-display text-xl font-semibold text-navy-deep">{att.rate}%</p><p className="text-xs text-slate-600">Attendance</p></div>
            <div className="rounded-xl bg-gold-soft p-3"><p className="font-display text-xl font-semibold text-navy-deep">{formatKobo(balance)}</p><p className="text-xs text-slate-600">Fee balance</p></div>
            <div className="rounded-xl bg-sky-soft p-3"><p className="font-display text-xl font-semibold text-navy-deep">{student.status.toLowerCase()}</p><p className="text-xs text-slate-600">Status</p></div>
          </div>
        </ProfileCard>

        <ProfileCard title="Account" icon={<ShieldPlus className="h-4 w-4" aria-hidden />} className="xl:col-span-2">
          <InfoGrid items={[
            ["Sign-in email", account.email],
            ["Role", <Badge key="r" tone="sky">Student</Badge>],
            ["Last sign-in", account.lastLoginAt ? formatDate(account.lastLoginAt) : "Not yet"],
            ["Account created", formatDate(account.createdAt)],
            ["Password", account.mustChangePassword ? <Badge key="p" tone="amber">Change required</Badge> : <Badge key="p" tone="green">Set</Badge>],
          ]} />
        </ProfileCard>

        <ProfileCard title="Student details" icon={<UserRound className="h-4 w-4" aria-hidden />} className="xl:col-span-2">
          <InfoGrid items={[
            ["First name", student.firstName],
            ["Last name", student.lastName],
            ["Admission number", student.admissionNo],
            ["Gender", student.gender],
            ["Date of birth", student.dob ? formatDate(student.dob) : "Not recorded"],
            ["Class", `${student.class.name} ${student.section.name}`],
            ["Admission date", formatDate(student.admissionDate)],
            ["Previous school", student.previousSchool ?? "Not recorded"],
            ["Family access code", student.familyAccessCode],
          ]} />
        </ProfileCard>

        <ProfileCard title="Parents and guardians" icon={<Users className="h-4 w-4" aria-hidden />}>
          {guardians.length === 0 && <p className="text-sm text-slate-500">No guardian recorded.</p>}
          <ul className="space-y-3">
            {guardians.map((g) => (
              <li key={g.id} className="rounded-xl border border-navy/10 p-4 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-navy-deep">{g.name}</p>
                  {g.isPrimary && <Badge tone="amber">Primary</Badge>}
                </div>
                <p className="text-slate-600">{g.relationship} · {g.phone}{g.email ? ` · ${g.email}` : ""}</p>
                {g.address && <p className="text-xs text-slate-500">{g.address}</p>}
              </li>
            ))}
          </ul>
        </ProfileCard>

        <ProfileCard title="Health" icon={<HeartPulse className="h-4 w-4" aria-hidden />}>
          <InfoGrid columns="sm:grid-cols-1" items={[
            ["Blood group", medical?.bloodGroup ?? "Not recorded"],
            ["Allergies", medical?.allergies ?? "None recorded"],
            ["Conditions", medical?.conditions ?? "None recorded"],
            ["Emergency contact", medical?.emergencyContact ?? "Not recorded"],
          ]} />
        </ProfileCard>

        <ProfileCard title="Fees" icon={<Wallet className="h-4 w-4" aria-hidden />}>
          <p className="text-sm text-slate-600">Outstanding balance across all terms</p>
          <p className="mt-2 font-display text-3xl font-semibold text-navy-deep">{formatKobo(balance)}</p>
          <a href="/portal/student/fees" className="focus-ring mt-4 inline-block rounded text-sm font-semibold text-navy hover:underline">Go to fees and receipts →</a>
        </ProfileCard>

        <ProfileCard title="Change password" className="xl:col-span-3">
          <PasswordForm action={changePasswordAction} />
        </ProfileCard>
      </div>
    </>
  );
}
