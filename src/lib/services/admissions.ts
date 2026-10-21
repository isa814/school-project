import "server-only";
import { AdmissionStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { createStudentWithLogin } from "@/lib/services/students";

export async function nextAdmissionReference(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await db.admissionApplication.count({ where: { reference: { startsWith: `ARI-${year}-` } } });
  return `ARI-${year}-${String(100 + count + 1).padStart(5, "0")}`;
}

export async function lookupApplication(reference: string) {
  return db.admissionApplication.findUnique({
    where: { reference: reference.trim().toUpperCase() },
    select: { reference: true, applicantName: true, classApplyingFor: true, status: true, createdAt: true, updatedAt: true },
  });
}

/** Converts an approved applicant into a Student (with login, guardian and family code). Admin only, called from an action. */
export async function approveApplication(applicationId: string, classId: string, sectionId: string) {
  const app = await db.admissionApplication.findUniqueOrThrow({ where: { id: applicationId } });
  if (app.studentId) throw new Error("This applicant is already enrolled");
  const [first, ...rest] = app.applicantName.trim().split(" ");
  const created = await createStudentWithLogin({
    firstName: first, lastName: rest.join(" ") || "-", gender: app.gender, classId, sectionId,
    previousSchool: app.previousSchool ?? undefined, guardianName: app.guardianName, guardianRelationship: "Guardian",
    guardianPhone: app.guardianPhone, guardianEmail: app.guardianEmail ?? undefined, guardianAddress: app.address,
  });
  await db.admissionApplication.update({ where: { id: applicationId }, data: { status: AdmissionStatus.APPROVED, studentId: created.student.id } });
  return created;
}

export async function setApplicationStatus(applicationId: string, status: AdmissionStatus) {
  return db.admissionApplication.update({ where: { id: applicationId }, data: { status } });
}
