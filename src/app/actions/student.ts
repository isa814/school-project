"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { getCurrentUser, requirePermission } from "@/lib/session";
import { redirect } from "next/navigation";
import { runAction, fstr, fnum, withParams } from "@/lib/action-utils";
import { consumeRateLimit, resetRateLimit } from "@/lib/ratelimit";
import { GUARDIAN_COOKIE, GUARDIAN_TTL_SECONDS, createGuardianToken, verifyGuardianToken } from "@/lib/guardian-gate";
import { initializeTransaction } from "@/lib/services/paystack";
import { nairaToKobo } from "@/lib/utils";
import { markNotificationsRead } from "@/lib/services/communications";

const id = z.string().uuid();

export async function changePasswordAction(fd: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("FORBIDDEN");
  const path = user.role === "STUDENT" ? "/portal/student/profile" : user.role === "TEACHER" ? "/portal/teacher/profile" : "/portal/admin/profile";
  await runAction(path, async () => {
    const data = z.object({
      current: z.string().min(1), next: z.string().min(8, "New password must be at least 8 characters").max(100),
      confirm: z.string(),
    }).parse({ current: fstr(fd, "current"), next: fstr(fd, "next"), confirm: fstr(fd, "confirm") });
    if (data.next !== data.confirm) throw new Error("New passwords do not match");
    const row = await db.user.findUniqueOrThrow({ where: { id: user.id } });
    if (!(await bcrypt.compare(data.current, row.passwordHash))) throw new Error("Current password is incorrect");
    await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(data.next, 10), mustChangePassword: false } });
    await logActivity({ userId: user.id, action: "PASSWORD_CHANGED", entity: "User", entityId: user.id });
    return "Password changed";
  });
}

/** Guardian View gate: verifies the 4-digit PIN (rate limited) and issues a 30-minute signed cookie. */
export async function unlockGuardianViewAction(fd: FormData) {
  const user = await requirePermission("pay:own");
  const student = await db.student.findUnique({ where: { userId: user.id }, select: { id: true, guardianPinHash: true } });
  await runAction("/portal/student/guardian", async () => {
    if (!student?.guardianPinHash) throw new Error("No Guardian PIN is set for this account. Contact the school office.");
    const pin = z.string().regex(/^\d{4}$/, "Enter the 4-digit Guardian PIN").parse(fstr(fd, "pin"));
    const key = `guardianpin:${student.id}`;
    if (!(await consumeRateLimit(key, 5, 15 * 60 * 1000))) throw new Error("Too many wrong PIN attempts. Try again in 15 minutes.");
    if (!(await bcrypt.compare(pin, student.guardianPinHash))) {
      await logActivity({ userId: user.id, action: "GUARDIAN_PIN_FAILED", entity: "Student", entityId: student.id });
      throw new Error("Incorrect Guardian PIN");
    }
    await resetRateLimit(key);
    cookies().set(GUARDIAN_COOKIE, createGuardianToken(student.id), { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: GUARDIAN_TTL_SECONDS });
    await logActivity({ userId: user.id, action: "GUARDIAN_VIEW_OPENED", entity: "Student", entityId: student.id });
    return "Guardian View unlocked for 30 minutes";
  });
}

export async function lockGuardianViewAction() {
  cookies().delete(GUARDIAN_COOKIE);
}

/**
 * Starts a Paystack payment for an invoice. Allowed for the student who owns the invoice,
 * or for a guardian who has unlocked Guardian View for that student.
 */
export async function startInvoicePaymentAction(fd: FormData) {
  const invoiceId = id.parse(fstr(fd, "invoiceId"));
  const amountNaira = fnum(fd, "amount");
  const user = await requirePermission("pay:own");
  const invoice = await db.invoice.findUnique({ where: { id: invoiceId }, include: { student: { include: { user: true } } } });
  if (!invoice) throw new Error("Invoice not found");
  const isOwner = invoice.student.userId === user.id;
  const isGuardian = verifyGuardianToken(cookies().get(GUARDIAN_COOKIE)?.value, invoice.studentId);
  if (!isOwner && !isGuardian) throw new Error("You can only pay invoices for your own account or an unlocked Guardian View");

  const outstanding = invoice.totalKobo - invoice.paidKobo;
  const amountKobo = nairaToKobo(amountNaira);
  const feesPath = "/portal/student/fees";

  let authUrl: string;
  try {
    if (!Number.isFinite(amountNaira) || amountKobo < 10000) throw new Error("Minimum payment is NGN 100");
    if (amountKobo > outstanding) throw new Error("Amount is more than the outstanding balance");
    const reference = `ARI-PAY-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    await db.payment.create({ data: { invoiceId, amountKobo, method: "CARD", gatewayRef: reference, status: "PENDING" } });
    const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const init = await initializeTransaction({
      email: invoice.student.user.email,
      amountKobo,
      reference,
      callbackUrl: `${base}/student/fees/callback`,
      metadata: { invoiceId, studentId: invoice.studentId, custom_fields: "fee_payment" },
    });
    authUrl = init.authorization_url;
    await logActivity({ userId: user.id, action: "PAYMENT_INITIATED", entity: "Invoice", entityId: invoiceId, meta: { reference, amountKobo } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Could not start payment";
    redirect(withParams(feesPath, { err: msg.slice(0, 200) }));
  }
  redirect(authUrl);
}

export async function markAllNotificationsReadAction() {
  const user = await getCurrentUser();
  if (!user) throw new Error("FORBIDDEN");
  await markNotificationsRead(user.id);
}
