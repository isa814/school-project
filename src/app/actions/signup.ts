"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { requireAdminPermission } from "@/lib/session";
import { runAction, fstr } from "@/lib/action-utils";
import { consumeRateLimit } from "@/lib/ratelimit";
import { createStudentWithLogin } from "@/lib/services/students";
import { setOneTimeCredentials } from "@/app/actions/cookies";

const signupSchema = z
  .object({
    firstName: z.string().trim().min(2, "First name is required").max(60),
    lastName: z.string().trim().min(2, "Last name is required").max(60),
    gender: z.enum(["Male", "Female"], { message: "Choose a gender" }),
    dob: z.string().optional(),
    email: z.string().trim().toLowerCase().email("Enter a valid email address").max(120),
    phone: z.string().trim().regex(/^[0-9+\s-]{7,20}$/, "Enter a valid phone number"),
    previousSchool: z.string().trim().max(120).optional(),
    desiredClassId: z.string().uuid("Choose a class").optional(),
    guardianName: z.string().trim().min(3, "Guardian name is required").max(100),
    guardianRelationship: z.string().trim().min(2, "Relationship is required").max(40),
    guardianPhone: z.string().trim().regex(/^[0-9+\s-]{7,20}$/, "Enter a valid guardian phone"),
    password: z.string().min(8, "Password must be at least 8 characters").max(100),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "Passwords do not match", path: ["confirm"] });

/** Public sign-up for students. Creates a pending request only. No account is active until an admin approves it. */
export async function submitSignupAction(fd: FormData) {
  await runAction("/portal/signup", async () => {
    const data = signupSchema.parse({
      firstName: fstr(fd, "firstName"), lastName: fstr(fd, "lastName"), gender: fstr(fd, "gender"),
      dob: fstr(fd, "dob") || undefined, email: fstr(fd, "email"), phone: fstr(fd, "phone"),
      previousSchool: fstr(fd, "previousSchool") || undefined, desiredClassId: fstr(fd, "desiredClassId") || undefined,
      guardianName: fstr(fd, "guardianName"), guardianRelationship: fstr(fd, "guardianRelationship"),
      guardianPhone: fstr(fd, "guardianPhone"), password: fstr(fd, "password"), confirm: fstr(fd, "confirm"),
    });
    if (!(await consumeRateLimit(`signup:${data.email}`, 5, 60 * 60 * 1000))) {
      throw new Error("Too many sign-up attempts for this email. Try again later.");
    }
    const existingUser = await db.user.findUnique({ where: { email: data.email } });
    if (existingUser) throw new Error("An account with this email already exists. Sign in instead.");
    const pending = await db.signupRequest.findFirst({ where: { email: data.email, status: "PENDING" } });
    if (pending) throw new Error("A request for this email is already waiting for approval.");

    await db.signupRequest.create({
      data: {
        firstName: data.firstName, lastName: data.lastName, gender: data.gender,
        dob: data.dob ? new Date(data.dob) : null, email: data.email, phone: data.phone,
        previousSchool: data.previousSchool || null, desiredClassId: data.desiredClassId ?? null,
        guardianName: data.guardianName, guardianRelationship: data.guardianRelationship, guardianPhone: data.guardianPhone,
        passwordHash: await bcrypt.hash(data.password, 10),
      },
    });
    return "Thank you. Your request has been received. The school office will review it and contact you.";
  });
}

const reviewSchema = z.object({
  requestId: z.string().uuid(),
  decision: z.enum(["APPROVE", "REJECT"]),
  classId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  note: z.string().trim().max(300).optional(),
});

/** Admin approves or rejects a sign-up. Approval creates the student record and activates the account. */
export async function reviewSignupAction(fd: FormData) {
  const user = await requireAdminPermission("students:write");
  await runAction("/portal/admin/signups", async () => {
    const data = reviewSchema.parse({
      requestId: fstr(fd, "requestId"), decision: fstr(fd, "decision"),
      classId: fstr(fd, "classId") || undefined, sectionId: fstr(fd, "sectionId") || undefined, note: fstr(fd, "note") || undefined,
    });
    if (data.decision === "REJECT") {
      const moved = await db.signupRequest.updateMany({
        where: { id: data.requestId, status: "PENDING" },
        data: { status: "REJECTED", reviewedById: user.id, reviewedAt: new Date(), reviewNote: data.note ?? null },
      });
      if (moved.count === 0) throw new Error("This request was already reviewed");
      await logActivity({ userId: user.id, action: "SIGNUP_REJECTED", entity: "SignupRequest", entityId: data.requestId });
      revalidatePath("/portal/admin/signups");
      return "Request rejected";
    }

    if (!data.classId || !data.sectionId) throw new Error("Choose a class and section before approving");
    const section = await db.section.findFirst({ where: { id: data.sectionId, classId: data.classId } });
    if (!section) throw new Error("That section does not belong to the chosen class");

    // Claim the request first so two admins cannot approve the same one.
    const claimed = await db.signupRequest.updateMany({
      where: { id: data.requestId, status: "PENDING" },
      data: { status: "APPROVED", reviewedById: user.id, reviewedAt: new Date(), reviewNote: data.note ?? null },
    });
    if (claimed.count === 0) throw new Error("This request was already reviewed");

    const req = await db.signupRequest.findUniqueOrThrow({ where: { id: data.requestId } });
    try {
      const created = await createStudentWithLogin({
        firstName: req.firstName, lastName: req.lastName, gender: req.gender, dob: req.dob,
        classId: data.classId, sectionId: data.sectionId, previousSchool: req.previousSchool ?? undefined,
        guardianName: req.guardianName, guardianRelationship: req.guardianRelationship, guardianPhone: req.guardianPhone,
        account: { email: req.email, passwordHash: req.passwordHash },
      });
      await db.signupRequest.update({ where: { id: req.id }, data: { studentId: created.student.id } });
      setOneTimeCredentials({
        Login: created.email, "Admission no.": created.student.admissionNo,
        "Guardian PIN": created.guardianPin, "Family access code": created.familyAccessCode,
      });
      await logActivity({ userId: user.id, action: "SIGNUP_APPROVED", entity: "Student", entityId: created.student.id, meta: { requestId: req.id } });
    } catch (error) {
      await db.signupRequest.update({ where: { id: req.id }, data: { status: "PENDING", reviewedById: null, reviewedAt: null } });
      throw error;
    }
    revalidatePath("/portal/admin/signups");
    revalidatePath("/portal/admin/students");
    return "Student approved and account activated. Save the login details shown at the top of this page.";
  });
}
