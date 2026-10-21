import { requireRole } from "@/lib/session";
import { can, type Permission } from "@/lib/permissions";
import { DashboardShell } from "@/components/shared/DashboardShell";
import type { NavIconName } from "@/components/shared/nav-icons";
import { OneTimeCredentials } from "@/components/shared/OneTimeCredentials";
import { readOneTimeCredentials } from "@/app/actions/cookies";

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super Admin", PRINCIPAL: "Principal", VICE_PRINCIPAL: "Vice Principal", ACCOUNTANT: "Accountant",
  LIBRARIAN: "Librarian", NURSE: "School Nurse", TRANSPORT_MANAGER: "Transport Manager",
};

const NAV: { href: string; label: string; icon: NavIconName; perm?: Permission }[] = [
  { href: "/portal/admin", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/portal/admin/students", label: "Students", icon: "Users", perm: "students:read" },
  { href: "/portal/admin/staff", label: "Staff", icon: "UserRound", perm: "staff:write" },
  { href: "/portal/admin/academics", label: "Academics", icon: "GraduationCap", perm: "academics:write" },
  { href: "/portal/admin/admissions", label: "Admissions", icon: "FileCheck2", perm: "admissions:review" },
  { href: "/portal/admin/signups", label: "Student sign-ups", icon: "UserPlus", perm: "students:write" },
  { href: "/portal/admin/fees", label: "Fees & Payments", icon: "Wallet", perm: "fees:read" },
  { href: "/portal/admin/results", label: "Results Approval", icon: "ClipboardCheck", perm: "results:approve" },
  { href: "/portal/admin/announcements", label: "Announcements", icon: "Megaphone", perm: "announcements:write" },
  { href: "/portal/admin/forum", label: "Forum Moderation", icon: "MessagesSquare", perm: "forum:moderate" },
  { href: "/portal/admin/users", label: "Users & Security", icon: "ShieldCheck", perm: "users:manage" },
  { href: "/portal/admin/reports", label: "Reports", icon: "BarChart3", perm: "reports:read" },
  { href: "/portal/admin/settings", label: "Settings", icon: "Settings", perm: "settings:write" },
  { href: "/portal/admin/profile", label: "My profile", icon: "UserRoundCog" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("ADMIN");
  const nav = NAV.filter((n) => !n.perm || can(user, n.perm));
  const credentials = readOneTimeCredentials();
  const roleLabel = user.adminRole ? ROLE_LABEL[user.adminRole] ?? user.adminRole : "Admin";
  return (
    <DashboardShell area="Admin" userName={user.name} avatarUrl={user.avatarUrl} roleLabel={roleLabel} nav={nav}>
      {credentials && <OneTimeCredentials items={credentials} />}
      {children}
    </DashboardShell>
  );
}
