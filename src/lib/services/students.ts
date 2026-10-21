import "server-only";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { Prisma, StudentStatus, UserRole } from "@prisma/client";
import { db } from "@/lib/db";

export function generateAdmissionNo(year: number, seq: number): string {
  return `ARI-${year}-${String(seq).padStart(4, "0")}`;
}

export function generateFamilyCode(): string {
  return `FAM-${(100000 + Math.floor(Math.random() * 899999)).toString()}`;
}

export function generateGuardianPin(): string {
  return String(1000 + Math.floor(Math.random() * 9000));
}

export function generateTempPassword(): string {
  return randomBytes(5).toString("base64url").slice(0, 10) + "!1";
}

/** Creates a STUDENT login, the student record, guardian record and family access code. */
export async function createStudentWithLogin(input: {
  firstName: string; lastName: string; gender: string; dob?: Date | null; classId: string; sectionId: string;
  previousSchool?: string; guardianName: string; guardianRelationship: string; guardianPhone: string; guardianEmail?: string; guardianAddress?: string;
  bloodGroup?: string; allergies?: string;
  admissionDate?: Date;
  /** Set when approving a self-service sign-up: the student keeps the password they chose. */
  account?: { email: string; passwordHash: string };
}) {
  const year = new Date().getFullYear();
  const count = await db.student.count();
  let admissionNo = generateAdmissionNo(year, count + 1);
  while (await db.student.findUnique({ where: { admissionNo } })) {
    admissionNo = generateAdmissionNo(year, Math.floor(Math.random() * 90000) + 1000);
  }
  const email = input.account?.email ?? `${admissionNo.toLowerCase()}@students.ansarruhul.demo`;
  const tempPassword = input.account ? "" : generateTempPassword();
  const pin = generateGuardianPin();
  const [passwordHash, pinHash] = await Promise.all([
    input.account ? Promise.resolve(input.account.passwordHash) : bcrypt.hash(tempPassword, 10),
    bcrypt.hash(pin, 10),
  ]);

  const student = await db.$transaction(async (tx) => {
    const user = await tx.user.create({ data: { email, passwordHash, role: UserRole.STUDENT, mustChangePassword: !input.account } });
    const st = await tx.student.create({
      data: {
        userId: user.id, admissionNo, firstName: input.firstName, lastName: input.lastName, gender: input.gender, dob: input.dob ?? null,
        classId: input.classId, sectionId: input.sectionId, previousSchool: input.previousSchool || null,
        admissionDate: input.admissionDate ?? new Date(), guardianPinHash: pinHash, familyAccessCode: generateFamilyCode(),
      },
    });
    await tx.guardian.create({
      data: { studentId: st.id, name: input.guardianName, relationship: input.guardianRelationship, phone: input.guardianPhone, email: input.guardianEmail || null, address: input.guardianAddress || null, isPrimary: true },
    });
    await tx.medicalRecord.create({ data: { studentId: st.id, bloodGroup: input.bloodGroup || null, allergies: input.allergies || null } });
    return st;
  });
  return { student, email, tempPassword, guardianPin: pin, familyAccessCode: student.familyAccessCode };
}

export async function listStudents(filter: { classId?: string; status?: StudentStatus; query?: string } = {}) {
  const where: Prisma.StudentWhereInput = {
    deletedAt: null,
    ...(filter.classId ? { classId: filter.classId } : {}),
    ...(filter.status ? { status: filter.status } : {}),
    ...(filter.query
      ? { OR: [{ firstName: { contains: filter.query, mode: "insensitive" } }, { lastName: { contains: filter.query, mode: "insensitive" } }, { admissionNo: { contains: filter.query, mode: "insensitive" } }] }
      : {}),
  };
  return db.student.findMany({ where, include: { class: true, section: true, guardians: { where: { isPrimary: true }, take: 1 } }, orderBy: [{ class: { sortOrder: "asc" } }, { lastName: "asc" }] });
}

export async function studentProfile(id: string) {
  return db.student.findFirst({
    where: { id, deletedAt: null },
    include: { class: true, section: true, guardians: true, medical: true, user: { select: { email: true, lastLoginAt: true } } },
  });
}

/** Class-level, term-level ranking. Only APPROVED or LOCKED scores count. */
export async function classPosition(studentId: string, termId: string) {
  const student = await db.student.findUniqueOrThrow({ where: { id: studentId }, select: { classId: true } });
  const classmates = await db.student.findMany({ where: { classId: student.classId, deletedAt: null, status: "ACTIVE" }, select: { id: true } });
  const scores = await db.score.findMany({ where: { termId, studentId: { in: classmates.map((c) => c.id) }, status: { in: ["APPROVED", "LOCKED"] } }, select: { studentId: true, total: true } });
  const totals = new Map<string, { sum: number; n: number }>();
  for (const s of scores) {
    const t = totals.get(s.studentId) ?? { sum: 0, n: 0 };
    t.sum += s.total;
    t.n += 1;
    totals.set(s.studentId, t);
  }
  const avgs = Array.from(totals.entries()).map(([id, t]) => ({ id, avg: t.sum / t.n })).sort((a, b) => b.avg - a.avg);
  const idx = avgs.findIndex((a) => a.id === studentId);
  return { position: idx === -1 ? null : idx + 1, outOf: classmates.length, average: idx === -1 ? null : avgs[idx].avg };
}
