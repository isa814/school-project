import "server-only";
import { ScoreStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { CA_MAX, EXAM_MAX, computeTotal, gradeFor } from "@/lib/grading";

export async function scoreSheet(params: { classId: string; subjectId: string; termId: string; sectionId?: string | null }) {
  const students = await db.student.findMany({
    where: { classId: params.classId, deletedAt: null, status: "ACTIVE", ...(params.sectionId ? { sectionId: params.sectionId } : {}) },
    orderBy: [{ section: { name: "asc" } }, { lastName: "asc" }],
    include: { section: true, scores: { where: { subjectId: params.subjectId, termId: params.termId } } },
  });
  return students.map((s) => {
    const sc = s.scores[0];
    return {
      id: s.id, name: `${s.firstName} ${s.lastName}`, admissionNo: s.admissionNo, section: s.section.name,
      ca: sc?.caScore ?? null, exam: sc?.examScore ?? null, total: sc?.total ?? null, grade: sc?.grade ?? null,
      status: (sc?.status ?? "DRAFT") as ScoreStatus, comment: sc?.comment ?? null,
    };
  });
}

/** Save or update draft scores. Refuses to change anything that is SUBMITTED, APPROVED or LOCKED. */
export async function saveDraftScores(params: {
  classId: string; subjectId: string; termId: string; enteredById: string | null;
  rows: { studentId: string; ca: number; exam: number }[];
}) {
  const ids = params.rows.map((r) => r.studentId);
  const locked = await db.score.findMany({
    where: { studentId: { in: ids }, subjectId: params.subjectId, termId: params.termId, status: { in: ["SUBMITTED", "APPROVED", "LOCKED"] } },
    select: { studentId: true },
  });
  const lockedSet = new Set(locked.map((l) => l.studentId));
  const writable = params.rows.filter((r) => !lockedSet.has(r.studentId));
  const members = await db.student.findMany({ where: { id: { in: writable.map((w) => w.studentId) }, classId: params.classId }, select: { id: true } });
  const memberSet = new Set(members.map((m) => m.id));

  await db.$transaction(
    writable.filter((r) => memberSet.has(r.studentId)).map((r) => {
      const ca = Math.min(CA_MAX, Math.max(0, r.ca));
      const exam = Math.min(EXAM_MAX, Math.max(0, r.exam));
      const total = computeTotal(ca, exam);
      const g = gradeFor(total);
      return db.score.upsert({
        where: { studentId_subjectId_termId: { studentId: r.studentId, subjectId: params.subjectId, termId: params.termId } },
        create: { studentId: r.studentId, subjectId: params.subjectId, termId: params.termId, caScore: ca, examScore: exam, total, grade: g.grade, remark: g.remark, status: "DRAFT", enteredById: params.enteredById },
        update: { caScore: ca, examScore: exam, total, grade: g.grade, remark: g.remark, enteredById: params.enteredById },
      });
    }),
  );
  return { saved: writable.length, skipped: params.rows.length - writable.length };
}

export async function submitScores(params: { classId: string; subjectId: string; termId: string }) {
  const res = await db.score.updateMany({
    where: { subjectId: params.subjectId, termId: params.termId, status: "DRAFT", student: { classId: params.classId } },
    data: { status: "SUBMITTED" },
  });
  return res.count;
}

/** Principal/vice principal decisions. Approve moves SUBMITTED -> APPROVED; return moves SUBMITTED -> DRAFT with a comment. */
export async function reviewScores(params: { classId: string; subjectId: string; termId: string; decision: "APPROVE" | "RETURN"; approverId: string; comment?: string }) {
  if (params.decision === "APPROVE") {
    const res = await db.score.updateMany({
      where: { subjectId: params.subjectId, termId: params.termId, status: "SUBMITTED", student: { classId: params.classId } },
      data: { status: "APPROVED", approvedById: params.approverId, comment: params.comment || null },
    });
    return res.count;
  }
  const res = await db.score.updateMany({
    where: { subjectId: params.subjectId, termId: params.termId, status: "SUBMITTED", student: { classId: params.classId } },
    data: { status: "DRAFT", comment: params.comment || "Returned for correction" },
  });
  return res.count;
}

export async function lockTerm(termId: string) {
  await db.$transaction([
    db.score.updateMany({ where: { termId, status: "APPROVED" }, data: { status: "LOCKED" } }),
    db.term.update({ where: { id: termId }, data: { isLocked: true } }),
  ]);
}

/** Pending SUBMITTED sheets grouped by class and subject, for the Results Approval screen. */
export async function pendingSheets(termId: string) {
  const rows = await db.score.findMany({
    where: { termId, status: "SUBMITTED" },
    select: { subjectId: true, subject: { select: { name: true } }, student: { select: { classId: true, class: { select: { name: true } } } } },
  });
  const map = new Map<string, { classId: string; className: string; subjectId: string; subjectName: string; count: number }>();
  for (const r of rows) {
    const key = `${r.student.classId}:${r.subjectId}`;
    const cur = map.get(key) ?? { classId: r.student.classId, className: r.student.class.name, subjectId: r.subjectId, subjectName: r.subject.name, count: 0 };
    cur.count += 1;
    map.set(key, cur);
  }
  return Array.from(map.values());
}
