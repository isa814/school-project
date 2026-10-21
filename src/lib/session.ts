import "server-only";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { AdminRole, UserRole } from "@prisma/client";
import { authOptions, HOME_BY_ROLE } from "@/lib/auth";
import { db } from "@/lib/db";
import { can, type Permission } from "@/lib/permissions";

export type CurrentUser = {
  id: string;
  role: UserRole;
  adminRole: AdminRole | null;
  name: string;
  email: string;
  avatarUrl: string | null;
};

/** Returns the signed-in, active user or null. Re-checks isActive against the database. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { isActive: true, role: true, adminRole: true, email: true, avatarUrl: true } });
  if (!user || !user.isActive) return null;
  return { id: session.user.id, role: user.role, adminRole: user.adminRole, name: session.user.name, email: user.email, avatarUrl: user.avatarUrl };
}

/** For pages: redirect to login when signed out, to the correct home when the role is wrong. */
export async function requireRole(role: UserRole): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/portal/login");
  if (user.role !== role) redirect(HOME_BY_ROLE[user.role]);
  return user;
}

/** For pages and server actions: require a permission. Throws in actions, redirects in pages when asPage. */
export async function requirePermission(permission: Permission): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/portal/login");
  if (!can(user, permission)) throw new Error("FORBIDDEN");
  return user;
}

export async function requireAdminPermission(permission: Permission): Promise<CurrentUser> {
  const user = await requireRole("ADMIN");
  if (!can(user, permission)) redirect("/portal/admin?denied=1");
  return user;
}

export function hasPermission(user: CurrentUser, permission: Permission): boolean {
  return can(user, permission);
}
