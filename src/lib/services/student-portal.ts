import "server-only";
import { db } from "@/lib/db";

/** The Student profile linked to the signed-in user, with class and section. Null if the account is not a student. */
export async function myStudent(userId: string) {
  return db.student.findFirst({ where: { userId, deletedAt: null }, include: { class: true, section: true, guardians: { where: { isPrimary: true }, take: 1 } } });
}

/** Approved or locked scores only, for the given term. Students never see drafts or submitted sheets. */
export async function visibleScores(studentId: string, termId: string) {
  return db.score.findMany({
    where: { studentId, termId, status: { in: ["APPROVED", "LOCKED"] } },
    include: { subject: true },
    orderBy: { subject: { name: "asc" } },
  });
}
