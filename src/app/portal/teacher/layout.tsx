import { requireRole } from "@/lib/session";
import { DashboardShell, type NavItem } from "@/components/shared/DashboardShell";

const NAV: NavItem[] = [
  { href: "/portal/teacher", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/portal/teacher/attendance", label: "Attendance", icon: "ClipboardList" },
  { href: "/portal/teacher/scores", label: "Scores", icon: "Table2" },
  { href: "/portal/teacher/materials", label: "Assignments & materials", icon: "FolderOpen" },
  { href: "/portal/teacher/students", label: "My students", icon: "Users" },
  { href: "/portal/teacher/timetable", label: "Timetable", icon: "CalendarDays" },
  { href: "/portal/teacher/profile", label: "My profile", icon: "UserRoundCog" },
];

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("TEACHER");
  return <DashboardShell area="Teacher" userName={user.name} avatarUrl={user.avatarUrl} roleLabel="Teacher" nav={NAV}>{children}</DashboardShell>;
}
