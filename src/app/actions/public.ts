"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { consumeRateLimit } from "@/lib/ratelimit";
import { runAction, fstr } from "@/lib/action-utils";
import { nextAdmissionReference } from "@/lib/services/admissions";
import { isValidFamilyCode } from "@/lib/services/communications";

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

const admissionSchema = z.object({
  applicantName: z.string().min(3, "Enter the applicant's full name").max(120),
  gender: z.enum(["Male", "Female"]),
  dob: z.string().optional(),
  classApplyingFor: z.enum(["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"]),
  guardianName: z.string().min(3).max(120),
  guardianPhone: z.string().min(10, "Enter a valid phone number").max(16),
  guardianEmail: z.string().email().optional().or(z.literal("")),
  address: z.string().min(5).max(200),
  previousSchool: z.string().max(160).optional(),
  consent: z.string().refine((v) => v === "on", { message: "Please confirm the information is correct" }),
});

/** Public admission form. Has a honeypot field (`website`) and per-IP rate limiting. */
export async function submitAdmissionAction(fd: FormData) {
  let reference = "";
  await runAction("/admissions/apply", async () => {
    if (fstr(fd, "website")) throw new Error("Submission rejected");
    const ip = await clientIp();
    if (!(await consumeRateLimit(`admission:${ip}`, 5, 60 * 60 * 1000))) throw new Error("Too many applications from this network. Please try again later.");
    const data = admissionSchema.parse({
      applicantName: fstr(fd, "applicantName"), gender: fstr(fd, "gender"), dob: fstr(fd, "dob") || undefined,
      classApplyingFor: fstr(fd, "classApplyingFor"), guardianName: fstr(fd, "guardianName"), guardianPhone: fstr(fd, "guardianPhone"),
      guardianEmail: fstr(fd, "guardianEmail"), address: fstr(fd, "address"), previousSchool: fstr(fd, "previousSchool") || undefined,
      consent: fstr(fd, "consent") || undefined,
    });
    reference = await nextAdmissionReference();
    await db.admissionApplication.create({
      data: {
        reference, applicantName: data.applicantName, gender: data.gender, dob: data.dob ? new Date(data.dob) : null,
        classApplyingFor: data.classApplyingFor, guardianName: data.guardianName, guardianPhone: data.guardianPhone,
        guardianEmail: data.guardianEmail || null, address: data.address, previousSchool: data.previousSchool ?? null,
        documents: { received: [] },
      },
    });
    await logActivity({ action: "ADMISSION_SUBMITTED", entity: "AdmissionApplication", meta: { reference }, ip });
    return `Application submitted. Your reference number is ${reference}. Keep it safe.`;
  });
}

export async function contactAction(fd: FormData) {
  await runAction("/contact", async () => {
    if (fstr(fd, "website")) throw new Error("Submission rejected");
    const ip = await clientIp();
    if (!(await consumeRateLimit(`contact:${ip}`, 10, 60 * 60 * 1000))) throw new Error("Too many messages. Please try again later.");
    const data = z.object({
      name: z.string().min(2).max(100), email: z.string().email(), phone: z.string().max(16).optional(),
      subject: z.string().min(3).max(120), message: z.string().min(10).max(2000),
    }).parse({ name: fstr(fd, "name"), email: fstr(fd, "email"), phone: fstr(fd, "phone") || undefined, subject: fstr(fd, "subject"), message: fstr(fd, "message") });
    await db.contactMessage.create({ data });
    return "Thank you. Our office will reply soon.";
  });
}

/** Parent Forum: a family access code (issued at admission) is required to post. Posts go to moderation. */
export async function forumThreadAction(fd: FormData) {
  const code = fstr(fd, "familyCode").toUpperCase();
  await runAction("/forum", async () => {
    if (fstr(fd, "website")) throw new Error("Submission rejected");
    if (!(await isValidFamilyCode(code))) throw new Error("That family access code is not recognised");
    const data = z.object({ title: z.string().min(5).max(140), body: z.string().min(10).max(2000), authorName: z.string().min(2).max(60) })
      .parse({ title: fstr(fd, "title"), body: fstr(fd, "body"), authorName: fstr(fd, "authorName") });
    await db.forumThread.create({ data: { ...data, familyAccessCode: code } });
    return "Thank you. Your post will appear once the school has reviewed it.";
  });
}

export async function forumReplyAction(fd: FormData) {
  const code = fstr(fd, "familyCode").toUpperCase();
  const threadId = z.string().uuid().parse(fstr(fd, "threadId"));
  await runAction(`/forum?code=${encodeURIComponent(code)}`, async () => {
    if (!(await isValidFamilyCode(code))) throw new Error("That family access code is not recognised");
    const thread = await db.forumThread.findUniqueOrThrow({ where: { id: threadId } });
    if (thread.isLocked) throw new Error("This thread is locked");
    const data = z.object({ body: z.string().min(3).max(1500), authorName: z.string().min(2).max(60) }).parse({ body: fstr(fd, "body"), authorName: fstr(fd, "authorName") });
    await db.forumReply.create({ data: { threadId, ...data } });
    return "Reply sent for review";
  });
}
