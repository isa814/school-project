"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { AdminRole, AdmissionStatus, AnnouncementAudience, ModerationStatus, PaymentMethod, StudentStatus, UserRole, DiscountType } from "@prisma/client";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { requireAdminPermission, requirePermission } from "@/lib/session";
import { runAction, fstr, fnum } from "@/lib/action-utils";
import { createStudentWithLogin, generateTempPassword } from "@/lib/services/students";
import { approveApplication, setApplicationStatus } from "@/lib/services/admissions";
import { createAnnouncement } from "@/lib/services/communications";
import { applyDiscount, generateInvoices, recordManualPayment, voidPayment } from "@/lib/services/fees";
import { lockTerm, reviewScores } from "@/lib/services/scores";
import { nairaToKobo } from "@/lib/utils";
import { setOneTimeCredentials, clearOneTimeCredentials } from "@/app/actions/cookies";

const id = z.string().uuid();

/* ---------- Students ---------- */
const studentSchema = z.object({
  firstName: z.string().min(2).max(60),
  lastName: z.string().min(2).max(60),
  gender: z.enum(["Male", "Female"]),
  dob: z.string().optional(),
  classId: id,
  sectionId: id,
  previousSchool: z.string().max(160).optional(),
  guardianName: z.string().min(3).max(120),
  guardianRelationship: z.string().min(2).max(40),
  guardianPhone: z.string().min(10).max(16),
  guardianEmail: z.string().email().optional().or(z.literal("")),
  guardianAddress: z.string().max(200).optional(),
  bloodGroup: z.string().max(5).optional(),
  allergies: z.string().max(200).optional(),
});

export async function createStudentAction(fd: FormData) {
  const user = await requireAdminPermission("students:write");
  await runAction("/portal/admin/students/new", async () => {
    const data = studentSchema.parse({
      firstName: fstr(fd, "firstName"), lastName: fstr(fd, "lastName"), gender: fstr(fd, "gender"), dob: fstr(fd, "dob") || undefined,
      classId: fstr(fd, "classId"), sectionId: fstr(fd, "sectionId"), previousSchool: fstr(fd, "previousSchool") || undefined,
      guardianName: fstr(fd, "guardianName"), guardianRelationship: fstr(fd, "guardianRelationship"), guardianPhone: fstr(fd, "guardianPhone"),
      guardianEmail: fstr(fd, "guardianEmail"), guardianAddress: fstr(fd, "guardianAddress") || undefined,
      bloodGroup: fstr(fd, "bloodGroup") || undefined, allergies: fstr(fd, "allergies") || undefined,
    });
    const created = await createStudentWithLogin({ ...data, dob: data.dob ? new Date(data.dob) : null });
    setOneTimeCredentials({
      Login: created.email, "Temporary password": created.tempPassword,
      "Guardian PIN": created.guardianPin, "Family access code": created.familyAccessCode,
    });
    await logActivity({ userId: user.id, action: "STUDENT_CREATED", entity: "Student", entityId: created.student.id, meta: { admissionNo: created.student.admissionNo } });
    revalidatePath("/portal/admin/students");
    return "Student created. Save the login details shown at the top of this page.";
  });
}

export async function updateStudentStatusAction(fd: FormData) {
  const user = await requireAdminPermission("students:write");
  const studentId = fstr(fd, "studentId");
  const path = `/portal/admin/students/${studentId}`;
  await runAction(path, async () => {
    const status = z.nativeEnum(StudentStatus).parse(fstr(fd, "status"));
    await db.student.update({ where: { id: id.parse(studentId) }, data: { status } });
    await logActivity({ userId: user.id, action: "STUDENT_STATUS_CHANGED", entity: "Student", entityId: studentId, meta: { status } });
    revalidatePath(path);
    return `Status changed to ${status.toLowerCase()}`;
  });
}

export async function promoteClassAction(fd: FormData) {
  const user = await requireAdminPermission("students:write");
  await runAction("/portal/admin/students", async () => {
    const from = id.parse(fstr(fd, "fromClassId"));
    const to = id.parse(fstr(fd, "toClassId"));
    if (from === to) throw new Error("Choose two different classes");
    const toSections = await db.section.findMany({ where: { classId: to } });
    const students = await db.student.findMany({ where: { classId: from, status: "ACTIVE", deletedAt: null }, include: { section: true } });
    for (const st of students) {
      const target = toSections.find((s) => s.name === st.section.name) ?? toSections[0];
      await db.student.update({ where: { id: st.id }, data: { classId: to, sectionId: target.id } });
    }
    await logActivity({ userId: user.id, action: "CLASS_PROMOTED", entity: "Class", meta: { from, to, count: students.length } });
    revalidatePath("/portal/admin/students");
    return `Promoted ${students.length} students`;
  });
}

export async function softDeleteStudentAction(fd: FormData) {
  const user = await requireAdminPermission("students:write");
  if (user.adminRole !== "SUPER_ADMIN") throw new Error("Only the super admin can archive students");
  const studentId = id.parse(fstr(fd, "studentId"));
  await runAction("/portal/admin/students", async () => {
    await db.student.update({ where: { id: studentId }, data: { deletedAt: new Date(), status: "WITHDRAWN" } });
    await logActivity({ userId: user.id, action: "STUDENT_ARCHIVED", entity: "Student", entityId: studentId });
    return "Student archived (soft-deleted)";
  });
}

/* ---------- Staff ---------- */
export async function createStaffAction(fd: FormData) {
  const user = await requireAdminPermission("staff:write");
  await runAction("/portal/admin/staff", async () => {
    const data = z.object({
      firstName: z.string().min(2), lastName: z.string().min(2), phone: z.string().min(10).max(16),
      email: z.string().email(), qualification: z.string().max(120).optional(),
    }).parse({ firstName: fstr(fd, "firstName"), lastName: fstr(fd, "lastName"), phone: fstr(fd, "phone"), email: fstr(fd, "email").toLowerCase(), qualification: fstr(fd, "qualification") || undefined });
    const count = await db.staff.count();
    const tempPassword = generateTempPassword();
    const u = await db.user.create({ data: { email: data.email, passwordHash: await bcrypt.hash(tempPassword, 10), role: UserRole.TEACHER, mustChangePassword: true } });
    const staff = await db.staff.create({ data: { userId: u.id, staffNo: `TCH-${String(count + 1).padStart(3, "0")}`, firstName: data.firstName, lastName: data.lastName, phone: data.phone, qualification: data.qualification ?? null } });
    setOneTimeCredentials({ Login: data.email, "Temporary password": tempPassword, "Staff number": staff.staffNo });
    await logActivity({ userId: user.id, action: "STAFF_CREATED", entity: "Staff", entityId: staff.id });
    return "Teacher account created. Save the login details shown at the top of this page.";
  });
}

export async function assignSubjectAction(fd: FormData) {
  const user = await requireAdminPermission("academics:write");
  await runAction("/portal/admin/staff", async () => {
    const data = z.object({ teacherId: id, subjectId: id, classId: id, sectionId: z.string().optional() }).parse({
      teacherId: fstr(fd, "teacherId"), subjectId: fstr(fd, "subjectId"), classId: fstr(fd, "classId"), sectionId: fstr(fd, "sectionId") || undefined,
    });
    const existing = await db.subjectAssignment.findFirst({
      where: { subjectId: data.subjectId, classId: data.classId, sectionId: data.sectionId ?? null },
    });
    if (existing) {
      await db.subjectAssignment.update({ where: { id: existing.id }, data: { teacherId: data.teacherId } });
    } else {
      await db.subjectAssignment.create({ data: { subjectId: data.subjectId, classId: data.classId, sectionId: data.sectionId ?? null, teacherId: data.teacherId } });
    }
    await logActivity({ userId: user.id, action: "SUBJECT_ASSIGNED", entity: "SubjectAssignment", meta: data });
    return "Subject assigned";
  });
}

/* ---------- Academics ---------- */
export async function createClassAction(fd: FormData) {
  const user = await requireAdminPermission("academics:write");
  await runAction("/portal/admin/academics", async () => {
    const name = z.string().min(2).max(20).parse(fstr(fd, "name"));
    const level = z.enum(["NURSERY", "PRIMARY", "JUNIOR", "SENIOR"]).parse(fstr(fd, "level"));
    const c = await db.class.create({ data: { name, level, sortOrder: (await db.class.count()) + 1 } });
    await db.section.createMany({ data: [{ classId: c.id, name: "A" }, { classId: c.id, name: "B" }] });
    await logActivity({ userId: user.id, action: "CLASS_CREATED", entity: "Class", entityId: c.id });
    return `Class ${name} created with arms A and B`;
  });
}

export async function setCurrentTermAction(fd: FormData) {
  const user = await requireAdminPermission("academics:write");
  await runAction("/portal/admin/academics", async () => {
    const termId = id.parse(fstr(fd, "termId"));
    await db.$transaction([db.term.updateMany({ data: { isCurrent: false } }), db.term.update({ where: { id: termId }, data: { isCurrent: true } })]);
    await logActivity({ userId: user.id, action: "CURRENT_TERM_SET", entity: "Term", entityId: termId });
    return "Current term updated";
  });
}

export async function createSubjectAction(fd: FormData) {
  const user = await requireAdminPermission("academics:write");
  await runAction("/portal/admin/academics", async () => {
    const name = z.string().min(2).max(80).parse(fstr(fd, "name"));
    const code = fstr(fd, "code") || null;
    const departmentId = fstr(fd, "departmentId") || null;
    await db.subject.create({ data: { name, code, departmentId } });
    await logActivity({ userId: user.id, action: "SUBJECT_CREATED", entity: "Subject", meta: { name } });
    return `Subject ${name} added`;
  });
}

/* ---------- Admissions ---------- */
export async function reviewAdmissionAction(fd: FormData) {
  const user = await requireAdminPermission("admissions:review");
  const appId = id.parse(fstr(fd, "applicationId"));
  await runAction("/portal/admin/admissions", async () => {
    const status = z.enum(["UNDER_REVIEW", "REJECTED"]).parse(fstr(fd, "status"));
    await setApplicationStatus(appId, status as AdmissionStatus);
    await logActivity({ userId: user.id, action: "ADMISSION_REVIEWED", entity: "AdmissionApplication", entityId: appId, meta: { status } });
    return `Application marked ${status.replace("_", " ").toLowerCase()}`;
  });
}

export async function approveAdmissionAction(fd: FormData) {
  const user = await requireAdminPermission("admissions:review");
  const appId = id.parse(fstr(fd, "applicationId"));
  await runAction("/portal/admin/admissions", async () => {
    const sectionId = id.parse(fstr(fd, "sectionId"));
    const section = await db.section.findUniqueOrThrow({ where: { id: sectionId } });
    const created = await approveApplication(appId, section.classId, sectionId);
    setOneTimeCredentials({ Login: created.email, "Temporary password": created.tempPassword, "Guardian PIN": created.guardianPin, "Family access code": created.familyAccessCode, "Admission no.": created.student.admissionNo });
    await logActivity({ userId: user.id, action: "ADMISSION_APPROVED", entity: "AdmissionApplication", entityId: appId, meta: { studentId: created.student.id } });
    revalidatePath("/portal/admin/admissions");
    revalidatePath("/portal/admin/students");
    return "Applicant approved and enrolled. Save the login details shown at the top of this page.";
  });
}

/* ---------- Users and security ---------- */
export async function resetUserPasswordAction(fd: FormData) {
  const user = await requireAdminPermission("users:manage");
  const userId = id.parse(fstr(fd, "userId"));
  await runAction("/portal/admin/users", async () => {
    const tempPassword = generateTempPassword();
    await db.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(tempPassword, 10), mustChangePassword: true } });
    setOneTimeCredentials({ "Temporary password": tempPassword });
    await logActivity({ userId: user.id, action: "PASSWORD_RESET", entity: "User", entityId: userId });
    return "Password reset. Share the temporary password securely.";
  });
}

export async function toggleUserActiveAction(fd: FormData) {
  const user = await requireAdminPermission("users:manage");
  const userId = id.parse(fstr(fd, "userId"));
  await runAction("/portal/admin/users", async () => {
    if (userId === user.id) throw new Error("You cannot deactivate your own account");
    const target = await db.user.findUniqueOrThrow({ where: { id: userId } });
    await db.user.update({ where: { id: userId }, data: { isActive: !target.isActive } });
    await logActivity({ userId: user.id, action: target.isActive ? "USER_DEACTIVATED" : "USER_ACTIVATED", entity: "User", entityId: userId });
    return target.isActive ? "Account deactivated" : "Account activated";
  });
}

export async function setAdminRoleAction(fd: FormData) {
  const user = await requireAdminPermission("users:manage");
  if (user.adminRole !== "SUPER_ADMIN") throw new Error("Only the super admin can change admin roles");
  const userId = id.parse(fstr(fd, "userId"));
  await runAction("/portal/admin/users", async () => {
    const adminRole = z.nativeEnum(AdminRole).parse(fstr(fd, "adminRole"));
    await db.user.update({ where: { id: userId }, data: { adminRole, role: UserRole.ADMIN } });
    await logActivity({ userId: user.id, action: "ADMIN_ROLE_CHANGED", entity: "User", entityId: userId, meta: { adminRole } });
    return `Role set to ${adminRole.replace("_", " ").toLowerCase()}`;
  });
}

export async function createAdminAccountAction(fd: FormData) {
  const user = await requireAdminPermission("users:manage");
  if (user.adminRole !== "SUPER_ADMIN") throw new Error("Only the super admin can create admin accounts");
  await runAction("/portal/admin/users", async () => {
    const email = z.string().email().parse(fstr(fd, "email").toLowerCase());
    const adminRole = z.nativeEnum(AdminRole).parse(fstr(fd, "adminRole"));
    const tempPassword = generateTempPassword();
    await db.user.create({ data: { email, adminRole, role: UserRole.ADMIN, passwordHash: await bcrypt.hash(tempPassword, 10), mustChangePassword: true } });
    setOneTimeCredentials({ Login: email, "Temporary password": tempPassword, Role: adminRole });
    await logActivity({ userId: user.id, action: "ADMIN_CREATED", entity: "User", meta: { email, adminRole } });
    return "Admin account created";
  });
}

export async function dismissCredentialsAction() {
  clearOneTimeCredentials();
}

/* ---------- Announcements ---------- */
export async function createAnnouncementAction(fd: FormData) {
  const user = await requirePermission("announcements:write");
  await runAction("/portal/admin/announcements", async () => {
    const data = z.object({
      title: z.string().min(4).max(140), body: z.string().min(4).max(4000),
      audience: z.nativeEnum(AnnouncementAudience), classId: z.string().optional(),
    }).parse({ title: fstr(fd, "title"), body: fstr(fd, "body"), audience: fstr(fd, "audience"), classId: fstr(fd, "classId") || undefined });
    if (data.audience === "CLASS" && !data.classId) throw new Error("Choose a class for a class announcement");
    await createAnnouncement({ ...data, classId: data.classId ?? null, createdById: user.id });
    await logActivity({ userId: user.id, action: "ANNOUNCEMENT_CREATED", entity: "Announcement", meta: { title: data.title, audience: data.audience } });
    revalidatePath("/portal/admin");
    return "Announcement published";
  });
}

/* ---------- Results approval ---------- */
export async function reviewScoresAction(fd: FormData) {
  const user = await requirePermission("results:approve");
  const path = "/portal/admin/results";
  await runAction(path, async () => {
    const data = z.object({
      classId: id, subjectId: id, termId: id,
      decision: z.enum(["APPROVE", "RETURN"]), comment: z.string().max(300).optional(),
    }).parse({ classId: fstr(fd, "classId"), subjectId: fstr(fd, "subjectId"), termId: fstr(fd, "termId"), decision: fstr(fd, "decision"), comment: fstr(fd, "comment") || undefined });
    const staff = await db.staff.findUnique({ where: { userId: user.id } });
    if (!staff) throw new Error("Approvals need a staff profile linked to this account");
    const count = await reviewScores({ ...data, approverId: staff.id });
    await logActivity({ userId: user.id, action: data.decision === "APPROVE" ? "SCORES_APPROVED" : "SCORES_RETURNED", entity: "Score", meta: { classId: data.classId, subjectId: data.subjectId, count } });
    return data.decision === "APPROVE" ? `Approved ${count} score(s)` : `Returned ${count} score(s) to the teacher`;
  });
}

export async function lockTermAction(fd: FormData) {
  const user = await requireAdminPermission("results:approve");
  const termId = id.parse(fstr(fd, "termId"));
  await runAction("/portal/admin/results", async () => {
    await lockTerm(termId);
    await logActivity({ userId: user.id, action: "TERM_LOCKED", entity: "Term", entityId: termId });
    return "Term locked. Approved results can no longer change.";
  });
}

/* ---------- Fees (accountant) ---------- */
export async function generateInvoicesAction(fd: FormData) {
  const user = await requireAdminPermission("fees:write");
  await runAction("/portal/admin/fees", async () => {
    const termId = id.parse(fstr(fd, "termId"));
    const classId = fstr(fd, "classId") || undefined;
    const res = await generateInvoices(termId, classId);
    await logActivity({ userId: user.id, action: "INVOICES_GENERATED", entity: "Term", entityId: termId, meta: res });
    return `${res.created} invoice(s) created, ${res.skipped} skipped`;
  });
}

export async function applyDiscountAction(fd: FormData) {
  const user = await requireAdminPermission("fees:write");
  const studentId = id.parse(fstr(fd, "studentId"));
  const path = fstr(fd, "returnTo") || "/portal/admin/fees";
  await runAction(path, async () => {
    const data = z.object({
      termId: id, type: z.nativeEnum(DiscountType), value: z.number().positive(), reason: z.string().min(3).max(160),
    }).parse({ termId: fstr(fd, "termId"), type: fstr(fd, "type"), value: fstnumOrNaN(fd, "value"), reason: fstr(fd, "reason") });
    const value = data.type === "PERCENT" ? Math.min(100, data.value) : nairaToKobo(data.value);
    await applyDiscount({ studentId, termId: data.termId, type: data.type, value: Math.round(value), reason: data.reason });
    await logActivity({ userId: user.id, action: "DISCOUNT_APPLIED", entity: "Student", entityId: studentId, meta: { type: data.type, reason: data.reason } });
    return "Discount applied";
  });
}

function fstnumOrNaN(fd: FormData, key: string) {
  const n = fnum(fd, key);
  return Number.isFinite(n) ? n : NaN;
}

export async function recordPaymentAction(fd: FormData) {
  const user = await requireAdminPermission("payments:record");
  const invoiceId = id.parse(fstr(fd, "invoiceId"));
  const path = fstr(fd, "returnTo") || "/portal/admin/fees";
  await runAction(path, async () => {
    const amountNaira = z.number().positive().parse(fnum(fd, "amount"));
    const method = z.nativeEnum(PaymentMethod).parse(fstr(fd, "method"));
    const payment = await recordManualPayment({ invoiceId, amountKobo: nairaToKobo(amountNaira), method, recordedById: user.id });
    await logActivity({ userId: user.id, action: "PAYMENT_RECORDED", entity: "Payment", entityId: payment.id, meta: { invoiceId, method, amountKobo: payment.amountKobo } });
    return `Payment recorded. Receipt ${payment.receiptNo}`;
  });
}

export async function voidPaymentAction(fd: FormData) {
  const user = await requireAdminPermission("payments:void");
  const paymentId = id.parse(fstr(fd, "paymentId"));
  const path = fstr(fd, "returnTo") || "/portal/admin/fees";
  await runAction(path, async () => {
    const reason = z.string().min(5, "Give a reason of at least 5 characters").max(200).parse(fstr(fd, "reason"));
    await voidPayment(paymentId, reason);
    await logActivity({ userId: user.id, action: "PAYMENT_VOIDED", entity: "Payment", entityId: paymentId, meta: { reason } });
    return "Payment voided. The invoice balance has been recalculated.";
  });
}

export async function sendFeeReminderAction(fd: FormData) {
  const user = await requireAdminPermission("fees:write");
  const invoiceId = id.parse(fstr(fd, "invoiceId"));
  await runAction("/portal/admin/fees/outstanding", async () => {
    const inv = await db.invoice.findUniqueOrThrow({ where: { id: invoiceId }, include: { student: { include: { user: true, guardians: { where: { isPrimary: true }, take: 1 } } } } });
    const balance = inv.totalKobo - inv.paidKobo;
    const text = `Reminder: outstanding school fees of NGN ${(balance / 100).toLocaleString("en-NG")} for ${inv.student.firstName} ${inv.student.lastName}. Pay on the portal.`;
    await db.notification.create({ data: { userId: inv.student.userId, title: "Fee reminder", body: text, link: "/portal/student/fees" } });
    console.info(`[sms:console] to=${inv.student.guardians[0]?.phone ?? "unknown"} text="${text}"`);
    await logActivity({ userId: user.id, action: "FEE_REMINDER_SENT", entity: "Invoice", entityId: invoiceId });
    return "Reminder queued (logged to console until an SMS provider is connected)";
  });
}

/* ---------- Parent forum moderation ---------- */
export async function moderateThreadAction(fd: FormData) {
  const user = await requirePermission("forum:moderate");
  const threadId = id.parse(fstr(fd, "threadId"));
  await runAction("/portal/admin/forum", async () => {
    const op = z.enum(["APPROVE", "REJECT", "LOCK", "UNLOCK"]).parse(fstr(fd, "op"));
    if (op === "LOCK" || op === "UNLOCK") await db.forumThread.update({ where: { id: threadId }, data: { isLocked: op === "LOCK" } });
    else await db.forumThread.update({ where: { id: threadId }, data: { status: op === "APPROVE" ? ModerationStatus.APPROVED : ModerationStatus.REJECTED } });
    await logActivity({ userId: user.id, action: `FORUM_THREAD_${op}`, entity: "ForumThread", entityId: threadId });
    return `Thread ${op.toLowerCase()}d`;
  });
}

export async function moderateReplyAction(fd: FormData) {
  const user = await requirePermission("forum:moderate");
  const replyId = id.parse(fstr(fd, "replyId"));
  await runAction("/portal/admin/forum", async () => {
    const op = z.enum(["APPROVE", "REJECT"]).parse(fstr(fd, "op"));
    await db.forumReply.update({ where: { id: replyId }, data: { status: op === "APPROVE" ? ModerationStatus.APPROVED : ModerationStatus.REJECTED } });
    await logActivity({ userId: user.id, action: `FORUM_REPLY_${op}`, entity: "ForumReply", entityId: replyId });
    return `Reply ${op === "APPROVE" ? "approved" : "rejected"}`;
  });
}

export async function updateStudentFieldsAction(fd: FormData) {
  const user = await requireAdminPermission("students:write");
  const studentId = id.parse(fstr(fd, "studentId"));
  const path = `/portal/admin/students/${studentId}`;
  await runAction(path, async () => {
    const data = z.object({ firstName: z.string().min(2).max(60), lastName: z.string().min(2).max(60), previousSchool: z.string().max(160).optional(), bloodGroup: z.string().max(5).optional(), allergies: z.string().max(200).optional() })
      .parse({ firstName: fstr(fd, "firstName"), lastName: fstr(fd, "lastName"), previousSchool: fstr(fd, "previousSchool") || undefined, bloodGroup: fstr(fd, "bloodGroup") || undefined, allergies: fstr(fd, "allergies") || undefined });
    await db.student.update({ where: { id: studentId }, data: { firstName: data.firstName, lastName: data.lastName, previousSchool: data.previousSchool ?? null } });
    await db.medicalRecord.upsert({ where: { studentId }, create: { studentId, bloodGroup: data.bloodGroup ?? null, allergies: data.allergies ?? null }, update: { bloodGroup: data.bloodGroup ?? null, allergies: data.allergies ?? null } });
    await logActivity({ userId: user.id, action: "STUDENT_UPDATED", entity: "Student", entityId: studentId });
    revalidatePath(path);
    return "Student profile saved";
  });
}
