import "server-only";
import { AttendanceStatus } from "@prisma/client";
import { db } from "@/lib/db";

export function startOfDayUTC(input: string | Date): Date {
  const d = typeof input === "string" ? new Date(`${input}T00:00:00Z`) : new Date(input);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Teachers may only edit today or the previous school day. Admins are not restricted. */
export function isAttendanceDateOpen(date: Date, now = new Date()): boolean {
  const today = startOfDayUTC(now);
  const diffDays = Math.round((today.getTime() - startOfDayUTC(date).getTime()) / 86_400_000);
  return diffDays >= 0 && diffDays <= 1;
}

export async function classRoster(classId: string, sectionId: string | null, date: Date) {
  const students = await db.student.findMany({
    where: { classId, deletedAt: null, status: "ACTIVE", ...(sectionId ? { sectionId } : {}) },
    orderBy: [{ section: { name: "asc" } }, { lastName: "asc" }],
    include: { section: true, attendance: { where: { date }, select: { status: true } } },
  });
  return students.map((s) => ({ id: s.id, name: `${s.firstName} ${s.lastName}`, admissionNo: s.admissionNo, section: s.section.name, status: s.attendance[0]?.status ?? null }));
}

export async function saveAttendance(params: { date: Date; termId: string; markedById: string | null; rows: { studentId: string; status: AttendanceStatus }[] }) {
  await db.$transaction(
    params.rows.map((r) =>
      db.attendance.upsert({
        where: { studentId_date: { studentId: r.studentId, date: params.date } },
        create: { studentId: r.studentId, date: params.date, status: r.status, termId: params.termId, markedById: params.markedById },
        update: { status: r.status, markedById: params.markedById, termId: params.termId },
      }),
    ),
  );
}

/** Attendance rate = (present + late + excused) / recorded days. Absent counts against the student. */
export async function attendanceRate(studentId: string, termId?: string) {
  const rows = await db.attendance.findMany({ where: { studentId, ...(termId ? { termId } : {}) }, select: { status: true, date: true } });
  const total = rows.length;
  const attended = rows.filter((r) => r.status !== "ABSENT").length;
  return { total, attended, absent: total - attended, rate: total ? Math.round((attended / total) * 1000) / 10 : 0, rows };
}
