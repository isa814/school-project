"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AttendanceStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { requirePermission } from "@/lib/session";
import { runAction, fstr } from "@/lib/action-utils";
import { isAttendanceDateOpen, saveAttendance, startOfDayUTC } from "@/lib/services/attendance";
import { saveDraftScores, submitScores } from "@/lib/services/scores";
import { getCurrentTerm, teacherCanMarkClass, teacherTeachesSubject } from "@/lib/services/academics";

const id = z.string().uuid();

/** Resolves the Staff profile for a teacher or admin acting as a teacher. */
async function actingStaffId(userId: string): Promise<string | null> {
  const staff = await db.staff.findUnique({ where: { userId }, select: { id: true } });
  return staff?.id ?? null;
}

export async function saveAttendanceAction(fd: FormData) {
  const user = await requirePermission("attendance:write");
  const classId = id.parse(fstr(fd, "classId"));
  const date = startOfDayUTC(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(fstr(fd, "date")));
  const path = `/portal/teacher/attendance?classId=${classId}&date=${fstr(fd, "date")}${fstr(fd, "sectionId") ? `&sectionId=${fstr(fd, "sectionId")}` : ""}`;

  await runAction(path, async () => {
    const isAdmin = user.role === "ADMIN";
    if (!isAdmin) {
      const staffId = await actingStaffId(user.id);
      if (!staffId || !(await teacherCanMarkClass(staffId, classId))) throw new Error("You do not teach this class");
      if (!isAttendanceDateOpen(date)) throw new Error("Attendance can only be edited for today or the previous school day");
    }
    const term = await getCurrentTerm();
    const rows: { studentId: string; status: AttendanceStatus }[] = [];
    for (const [key, value] of Array.from(fd.entries())) {
      if (!key.startsWith("status_")) continue;
      const studentId = id.parse(key.slice(7));
      rows.push({ studentId, status: z.nativeEnum(AttendanceStatus).parse(String(value)) });
    }
    if (rows.length === 0) throw new Error("No students to save");
    const valid = await db.student.findMany({ where: { id: { in: rows.map((r) => r.studentId) }, classId, deletedAt: null }, select: { id: true } });
    const ok = new Set(valid.map((v) => v.id));
    const filtered = rows.filter((r) => ok.has(r.studentId));
    await saveAttendance({ date, termId: term.id, markedById: await actingStaffId(user.id), rows: filtered });
    await logActivity({ userId: user.id, action: "ATTENDANCE_SAVED", entity: "Class", entityId: classId, meta: { date: fstr(fd, "date"), count: filtered.length } });
    revalidatePath("/portal/teacher/attendance");
    return `Attendance saved for ${filtered.length} students`;
  });
}

export async function saveScoresAction(fd: FormData) {
  const user = await requirePermission("scores:write");
  const classId = id.parse(fstr(fd, "classId"));
  const subjectId = id.parse(fstr(fd, "subjectId"));
  const path = `/portal/teacher/scores?classId=${classId}&subjectId=${subjectId}`;

  await runAction(path, async () => {
    const term = await getCurrentTerm();
    const staffId = await actingStaffId(user.id);
    if (user.role !== "ADMIN") {
      if (!staffId || !(await teacherTeachesSubject(staffId, classId, subjectId))) throw new Error("You are not assigned to this subject for this class");
    }
    const rows: { studentId: string; ca: number; exam: number }[] = [];
    const ids = new Set<string>();
    for (const [key] of Array.from(fd.entries())) {
      if (key.startsWith("ca_")) ids.add(key.slice(3));
    }
    for (const sid of Array.from(ids)) {
      const ca = Number(fstr(fd, `ca_${sid}`) || 0);
      const exam = Number(fstr(fd, `exam_${sid}`) || 0);
      if (!Number.isFinite(ca) || !Number.isFinite(exam)) throw new Error("Scores must be numbers");
      rows.push({ studentId: id.parse(sid), ca, exam });
    }
    const res = await saveDraftScores({ classId, subjectId, termId: term.id, enteredById: staffId, rows });
    await logActivity({ userId: user.id, action: "SCORES_SAVED_DRAFT", entity: "Subject", entityId: subjectId, meta: { classId, saved: res.saved } });
    revalidatePath("/portal/teacher/scores");
    return res.skipped ? `Saved ${res.saved}. ${res.skipped} locked row(s) were skipped.` : `Draft saved for ${res.saved} students`;
  });
}

export async function submitScoresAction(fd: FormData) {
  const user = await requirePermission("scores:write");
  const classId = id.parse(fstr(fd, "classId"));
  const subjectId = id.parse(fstr(fd, "subjectId"));
  await runAction(`/portal/teacher/scores?classId=${classId}&subjectId=${subjectId}`, async () => {
    const term = await getCurrentTerm();
    const staffId = await actingStaffId(user.id);
    if (user.role !== "ADMIN" && (!staffId || !(await teacherTeachesSubject(staffId, classId, subjectId)))) throw new Error("You are not assigned to this subject for this class");
    const count = await submitScores({ classId, subjectId, termId: term.id });
    if (count === 0) throw new Error("There are no draft scores to submit. Save your scores first.");
    await logActivity({ userId: user.id, action: "SCORES_SUBMITTED", entity: "Subject", entityId: subjectId, meta: { classId, count } });
    return `Submitted ${count} scores for approval`;
  });
}

export async function uploadMaterialAction(fd: FormData) {
  const user = await requirePermission("materials:write");
  const [classRaw, subjectRaw] = fstr(fd, "pair").split(":");
  const classId = id.parse(classRaw);
  const subjectId = id.parse(subjectRaw);
  await runAction("/portal/teacher/materials", async () => {
    const data = z.object({
      title: z.string().min(3).max(140), description: z.string().max(500).optional(),
      kind: z.enum(["ASSIGNMENT", "MATERIAL"]), url: z.string().url().optional().or(z.literal("")),
      dueDate: z.string().optional(),
    }).parse({ title: fstr(fd, "title"), description: fstr(fd, "description") || undefined, kind: fstr(fd, "kind"), url: fstr(fd, "url"), dueDate: fstr(fd, "dueDate") || undefined });
    const staffId = await actingStaffId(user.id);
    if (user.role !== "ADMIN" && (!staffId || !(await teacherTeachesSubject(staffId, classId, subjectId)))) throw new Error("You are not assigned to this subject for this class");
    await db.material.create({
      data: {
        title: data.title, description: data.description ?? null, kind: data.kind, url: data.url || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null, classId, subjectId, createdById: user.id,
      },
    });
    await logActivity({ userId: user.id, action: "MATERIAL_POSTED", entity: "Material", meta: { title: data.title, classId } });
    return `${data.kind === "ASSIGNMENT" ? "Assignment" : "Material"} posted`;
  });
}
