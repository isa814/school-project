import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { changePasswordAction } from "@/app/actions/student";
import { PageHeader } from "@/components/shared/PageHeader";
import { Flash } from "@/components/shared/Flash";
import { AvatarUpload } from "@/components/portal/AvatarUpload";
import { InfoGrid, ProfileCard } from "@/components/portal/InfoGrid";
import { PasswordForm } from "@/components/portal/PasswordForm";
import { Badge } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { UserRound, ShieldPlus, Activity } from "lucide-react";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super Admin", PRINCIPAL: "Principal", VICE_PRINCIPAL: "Vice Principal", ACCOUNTANT: "Accountant",
  LIBRARIAN: "Librarian", NURSE: "School Nurse", TRANSPORT_MANAGER: "Transport Manager",
};

export default async function AdminProfile({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  const user = await requireRole("ADMIN");
  const [account, staff, activity] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: user.id }, select: { email: true, lastLoginAt: true, createdAt: true, mustChangePassword: true, adminRole: true } }),
    db.staff.findUnique({ where: { userId: user.id }, include: { department: true } }),
    db.activityLog.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 10 }),
  ]);
  const roleName = account.adminRole ? ROLE_LABEL[account.adminRole] ?? account.adminRole : "Admin";

  return (
    <>
      <PageHeader eyebrow="My profile" title={user.name} description={`${roleName} · ${account.email}`} />
      <Flash ok={searchParams.ok} err={searchParams.err} />

      <div className="grid gap-6 xl:grid-cols-3">
        <ProfileCard title="Photo" icon={<UserRound className="h-4 w-4" aria-hidden />} className="xl:row-span-2">
          <AvatarUpload name={user.name} currentUrl={user.avatarUrl} />
        </ProfileCard>

        <ProfileCard title="Account" icon={<ShieldPlus className="h-4 w-4" aria-hidden />} className="xl:col-span-2">
          <InfoGrid items={[
            ["Full name", user.name],
            ["Sign-in email", account.email],
            ["Role", <Badge key="r" tone="sky">Admin</Badge>],
            ["Admin role", roleName],
            ["Last sign-in", account.lastLoginAt ? formatDate(account.lastLoginAt) : "Not yet"],
            ["Account created", formatDate(account.createdAt)],
            ["Password", account.mustChangePassword ? <Badge key="p" tone="amber">Change required</Badge> : <Badge key="p" tone="green">Set</Badge>],
            ["Staff record", staff ? `${staff.staffNo}${staff.department ? ` · ${staff.department.name}` : ""}` : "None linked"],
            ["Phone", staff?.phone ?? "Not recorded"],
          ]} />
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
