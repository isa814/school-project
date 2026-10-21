import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { changePasswordAction } from "@/app/actions/student";
import { PageHeader } from "@/components/shared/PageHeader";
import { Flash } from "@/components/shared/Flash";
import { AvatarUpload } from "@/components/portal/AvatarUpload";
import { InfoGrid, ProfileCard } from "@/components/portal/InfoGrid";
import { PasswordForm } from "@/components/portal/PasswordForm";
import { Badge, Notice } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { UserRound, ShieldPlus, BookOpenCheck, School, Activity } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeacherProfile({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  const user = await requireRole("TEACHER");
  const staff = await db.staff.findUnique({ where: { userId: user.id }, include: { department: true } });
  if (!staff) return <Notice tone="error">Your staff profile is not linked to this account. Contact the school office.</Notice>;

  const [account, assignments, classTeacherOf, activity] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: user.id }, select: { email: true, lastLoginAt: true, createdAt: true, mustChangePassword: true } }),
    db.subjectAssignment.findMany({ where: { teacherId: staff.id }, include: { subject: true, class: true, section: true }, orderBy: [{ class: { sortOrder: "asc" } }, { subject: { name: "asc" } }] }),
    db.class.findMany({ where: { classTeacherId: staff.id }, orderBy: { sortOrder: "asc" } }),
    db.activityLog.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);
  const fullName = `${staff.firstName} ${staff.lastName}`;

  return (
    <>
      <PageHeader eyebrow="My profile" title={fullName} description={`${staff.staffNo} · ${staff.department?.name ?? "No department"}`} />
      <Flash ok={searchParams.ok} err={searchParams.err} />

      <div className="grid gap-6 xl:grid-cols-3">
        <ProfileCard title="Photo" icon={<UserRound className="h-4 w-4" aria-hidden />} className="xl:row-span-2">
          <AvatarUpload name={fullName} currentUrl={user.avatarUrl} />
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-sky-soft p-3"><p className="font-display text-xl font-semibold text-navy-deep">{assignments.length}</p><p className="text-xs text-slate-600">Subject classes</p></div>
            <div className="rounded-xl bg-sky-soft p-3"><p className="font-display text-xl font-semibold text-navy-deep">{classTeacherOf.length}</p><p className="text-xs text-slate-600">Form classes</p></div>
            <div className="rounded-xl bg-sky-soft p-3"><p className="font-display text-xl font-semibold text-navy-deep">{staff.status.toLowerCase()}</p><p className="text-xs text-slate-600">Status</p></div>
          </div>
        </ProfileCard>

        <ProfileCard title="Account" icon={<ShieldPlus className="h-4 w-4" aria-hidden />} className="xl:col-span-2">
          <InfoGrid items={[
            ["Sign-in email", account.email],
            ["Role", <Badge key="r" tone="sky">Teacher</Badge>],
            ["Last sign-in", account.lastLoginAt ? formatDate(account.lastLoginAt) : "Not yet"],
            ["Account created", formatDate(account.createdAt)],
            ["Password", account.mustChangePassword ? <Badge key="p" tone="amber">Change required</Badge> : <Badge key="p" tone="green">Set</Badge>],
          ]} />
        </ProfileCard>

        <ProfileCard title="Staff details" icon={<UserRound className="h-4 w-4" aria-hidden />} className="xl:col-span-2">
          <InfoGrid items={[
            ["First name", staff.firstName],
            ["Last name", staff.lastName],
            ["Staff number", staff.staffNo],
            ["Department", staff.department?.name ?? "Not assigned"],
            ["Phone", staff.phone ?? "Not recorded"],
            ["Qualification", staff.qualification ?? "Not recorded"],
            ["Hire date", formatDate(staff.hireDate)],
            ["Employment status", staff.status],
            ["Biography", staff.bio ?? "Not recorded"],
          ]} />
        </ProfileCard>

        <ProfileCard title="Subjects I teach" icon={<BookOpenCheck className="h-4 w-4" aria-hidden />}>
          {assignments.length === 0 && <p className="text-sm text-slate-500">No subjects assigned yet.</p>}
          <ul className="divide-y divide-navy/5 text-sm">
            {assignments.map((a) => (
              <li key={a.id} className="flex justify-between gap-2 py-2">
                <span className="font-medium text-navy-deep">{a.subject.name}</span>
                <span className="text-slate-600">{a.class.name}{a.section ? ` ${a.section.name}` : ""}</span>
              </li>
            ))}
          </ul>
        </ProfileCard>

        <ProfileCard title="Form class" icon={<School className="h-4 w-4" aria-hidden />}>
          {classTeacherOf.length === 0 && <p className="text-sm text-slate-500">You are not a form teacher for any class.</p>}
          <ul className="space-y-2 text-sm">
            {classTeacherOf.map((c) => <li key={c.id} className="rounded-xl bg-sky-soft/60 px-4 py-3 font-semibold text-navy-deep">{c.name} · {c.level}</li>)}
          </ul>
        </ProfileCard>

        <ProfileCard title="Recent activity" icon={<Activity className="h-4 w-4" aria-hidden />} className="xl:col-span-2">
          <ul className="divide-y divide-navy/5 text-sm">
            {activity.map((a) => <li key={a.id} className="flex justify-between gap-2 py-2"><span className="font-medium text-navy-deep">{a.action.replace(/_/g, " ").toLowerCase()}</span><span className="text-xs text-slate-500">{formatDate(a.createdAt)}</span></li>)}
            {activity.length === 0 && <li className="py-2 text-slate-500">No activity recorded yet.</li>}
          </ul>
        </ProfileCard>

        <ProfileCard title="Change password" className="xl:col-span-3">
          <PasswordForm action={changePasswordAction} />
        </ProfileCard>
      </div>
    </>
  );
}
