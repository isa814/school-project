import {
  LayoutDashboard, Users, UserRound, GraduationCap, FileCheck2, Wallet, ClipboardCheck, Megaphone, MessagesSquare,
  ShieldCheck, BarChart3, Settings, ClipboardList, Table2, FolderOpen, CalendarDays, Clock, BookMarked,
  UserPlus, UserRoundCog, ImagePlus,
  type LucideIcon,
} from "lucide-react";

/**
 * Navigation icons are referenced by name. Passing component references from server layouts
 * into client components is not serializable, so the shell resolves names here.
 */
export const NAV_ICONS = {
  LayoutDashboard, Users, UserRound, GraduationCap, FileCheck2, Wallet, ClipboardCheck, Megaphone, MessagesSquare,
  ShieldCheck, BarChart3, Settings, ClipboardList, Table2, FolderOpen, CalendarDays, Clock, BookMarked,
  UserPlus, UserRoundCog, ImagePlus,
} satisfies Record<string, LucideIcon>;

export type NavIconName = keyof typeof NAV_ICONS;
