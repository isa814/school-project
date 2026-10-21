import type { AdminRole, UserRole } from "@prisma/client";

export const PERMISSIONS = [
  "students:read",
  "students:write",
  "medical:read",
  "staff:write",
  "academics:write",
  "attendance:write",
  "attendance:read",
  "scores:write",
  "scores:read",
  "results:approve",
  "materials:write",
  "fees:write",
  "fees:read",
  "payments:record",
  "payments:void",
  "reports:read",
  "reports:finance",
  "announcements:write",
  "forum:moderate",
  "admissions:review",
  "users:manage",
  "settings:write",
  "contact:read",
  "pay:own",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

type Actor = { role: UserRole; adminRole?: AdminRole | null };

const ALL: Permission[] = [...PERMISSIONS];

/** Permission matrix per admin sub-role. TEACHER and STUDENT are handled separately below. */
const ADMIN_MATRIX: Record<AdminRole, Permission[]> = {
  SUPER_ADMIN: ALL,
  PRINCIPAL: [
    "students:read", "students:write", "medical:read", "staff:write", "academics:write",
    "attendance:read", "scores:read", "results:approve", "reports:read", "reports:finance",
    "announcements:write", "forum:moderate", "admissions:review", "fees:read", "contact:read",
  ],
  VICE_PRINCIPAL: [
    "students:read", "students:write", "academics:write", "attendance:read", "scores:read",
    "results:approve", "reports:read", "announcements:write", "forum:moderate", "admissions:review",
    "fees:read", "contact:read",
  ],
  ACCOUNTANT: ["fees:write", "fees:read", "payments:record", "payments:void", "reports:finance", "reports:read", "students:read"],
  LIBRARIAN: ["students:read"],
  NURSE: ["students:read", "medical:read"],
  TRANSPORT_MANAGER: ["students:read"],
};

const TEACHER_PERMISSIONS: Permission[] = [
  "attendance:write", "attendance:read", "scores:write", "scores:read", "materials:write", "students:read", "announcements:write",
];

const STUDENT_PERMISSIONS: Permission[] = ["pay:own"];

export function permissionsFor(actor: Actor): Permission[] {
  if (actor.role === "ADMIN") return actor.adminRole ? ADMIN_MATRIX[actor.adminRole] : [];
  if (actor.role === "TEACHER") return TEACHER_PERMISSIONS;
  if (actor.role === "STUDENT") return STUDENT_PERMISSIONS;
  return [];
}

export function can(actor: Actor, permission: Permission): boolean {
  return permissionsFor(actor).includes(permission);
}
