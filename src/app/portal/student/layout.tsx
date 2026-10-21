import { requireRole } from "@/lib/session";
import { DashboardShell, type NavItem } from "@/components/shared/DashboardShell";

const NAV: NavItem[] = [
  { href: "/portal/student", label: "Home", icon: "LayoutDashboard" },
  { href: "/portal/student/timetable", label: "Timetable", icon: "Clock" },
  { href: "/portal/student/attendance", label: "Attendance", icon: "ClipboardList" },
  { href: "/portal/student/assignments", label: "Assignments", icon: "BookMarked" },
  { href: "/portal/student/results", label: "Results", icon: "GraduationCap" },
  { href: "/portal/student/fees", label: "Fees & receipts", icon: "Wallet" },
  { href: "/portal/student/guardian", label: "Guardian View", icon: "ShieldCheck" },
  { href: "/portal/student/profile", label: "My profile", icon: "UserRound" },
];

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("STUDENT");
  return <DashboardShell area="Student" userName={user.name} avatarUrl={user.avatarUrl} roleLabel="Student" nav={NAV}>{children}</DashboardShell>;
}
