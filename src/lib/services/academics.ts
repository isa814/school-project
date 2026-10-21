import "server-only";
import { db } from "@/lib/db";

export async function getCurrentTerm() {
  const term = await db.term.findFirst({ where: { isCurrent: true }, include: { session: true } });
  if (!term) throw new Error("No current term is set. Mark a term as current in Academics.");
  return term;
}

export async function listTerms() {
  return db.term.findMany({ include: { session: true }, orderBy: [{ session: { startDate: "desc" } }, { startDate: "asc" }] });
}

export async function listClasses() {
  return db.class.findMany({ include: { sections: { orderBy: { name: "asc" } } }, orderBy: { sortOrder: "asc" } });
}

export async function listSubjects() {
  return db.subject.findMany({ include: { department: true }, orderBy: { name: "asc" } });
}

/** Class and section ids a teacher is linked to through subject assignments or class-teacher role. */
export async function teacherScope(staffId: string) {
  const [assignments, classTeacher] = await Promise.all([
    db.subjectAssignment.findMany({ where: { teacherId: staffId }, select: { classId: true, sectionId: true, subjectId: true } }),
    db.class.findMany({ where: { classTeacherId: staffId }, select: { id: true, sections: { select: { id: true } } } }),
  ]);
  const classIds = new Set(assignments.map((a) => a.classId));
  const subjectIdsByClass = new Map<string, Set<string>>();
  for (const a of assignments) {
    const set = subjectIdsByClass.get(a.classId) ?? new Set<string>();
    set.add(a.subjectId);
    subjectIdsByClass.set(a.classId, set);
  }
  for (const c of classTeacher) classIds.add(c.id);
  return { classIds: Array.from(classIds), subjectIdsByClass };
}

/** True when the teacher teaches this subject to this class (used to guard score entry). */
export async function teacherTeachesSubject(staffId: string, classId: string, subjectId: string): Promise<boolean> {
  const hit = await db.subjectAssignment.findFirst({ where: { teacherId: staffId, classId, subjectId }, select: { id: true } });
  return !!hit;
}

/** True when the teacher may take attendance for this class (subject teacher or class teacher). */
export async function teacherCanMarkClass(staffId: string, classId: string): Promise<boolean> {
  const [assigned, isClassTeacher] = await Promise.all([
    db.subjectAssignment.findFirst({ where: { teacherId: staffId, classId }, select: { id: true } }),
    db.class.findFirst({ where: { id: classId, classTeacherId: staffId }, select: { id: true } }),
  ]);
  return !!assigned || !!isClassTeacher;
}
