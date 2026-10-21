import "server-only";
import { InvoiceStatus, PaymentMethod, PaymentStatus, type Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { generateReference } from "@/lib/utils";

/** Recalculate an invoice from its lines and successful payments. Single source of truth for status. */
export async function recalcInvoice(invoiceId: string, tx: Prisma.TransactionClient = db): Promise<void> {
  const invoice = await tx.invoice.findUniqueOrThrow({ where: { id: invoiceId }, include: { lines: true, payments: true } });
  const totalKobo = Math.max(0, invoice.lines.reduce((sum, l) => sum + l.amountKobo, 0));
  const paidKobo = invoice.payments.filter((p) => p.status === PaymentStatus.SUCCESS).reduce((s, p) => s + p.amountKobo, 0);
  let status: InvoiceStatus = InvoiceStatus.UNPAID;
  if (paidKobo >= totalKobo && totalKobo > 0) status = InvoiceStatus.PAID;
  else if (paidKobo > 0) status = InvoiceStatus.PARTIAL;
  await tx.invoice.update({ where: { id: invoiceId }, data: { totalKobo, paidKobo, status } });
}

function nextInvoiceNo(): string {
  return `INV-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;
}

export function nextReceiptNo(): string {
  return `RCP-${new Date().getFullYear()}-${Date.now().toString().slice(-8)}`;
}

/**
 * Creates invoices for every active student in the given term (optionally one class) who doesn't have one yet.
 * Discounts that already exist for the student and term are applied as negative lines.
 */
export async function generateInvoices(termId: string, classId?: string, dueDate?: Date): Promise<{ created: number; skipped: number }> {
  const term = await db.term.findUniqueOrThrow({ where: { id: termId } });
  const students = await db.student.findMany({
    where: { deletedAt: null, status: "ACTIVE", ...(classId ? { classId } : {}) },
    include: { discounts: { where: { termId } } },
  });
  const feeItems = await db.feeItem.findMany({ where: { termId, ...(classId ? { classId } : {}) } });
  const existing = await db.invoice.findMany({ where: { termId }, select: { studentId: true } });
  const have = new Set(existing.map((i) => i.studentId));
  let created = 0;
  let skipped = 0;
  const due = dueDate ?? new Date(term.endDate);

  for (const st of students) {
    if (have.has(st.id)) { skipped++; continue; }
    const items = feeItems.filter((f) => f.classId === st.classId);
    if (items.length === 0) { skipped++; continue; }
    const gross = items.reduce((s, f) => s + f.amountKobo, 0);
    const lines: Prisma.InvoiceLineCreateWithoutInvoiceInput[] = items.map((f) => ({ description: f.name, amountKobo: f.amountKobo, feeItem: { connect: { id: f.id } } }));
    for (const d of st.discounts) {
      const amt = d.type === "PERCENT" ? -Math.round((gross * d.value) / 100) : -d.value;
      lines.push({ description: `Discount: ${d.reason}`, amountKobo: amt });
    }
    const total = Math.max(0, lines.reduce((s, l) => s + l.amountKobo, 0));
    await db.invoice.create({
      data: { invoiceNo: nextInvoiceNo() + String(created).padStart(2, "0"), studentId: st.id, termId, totalKobo: total, paidKobo: 0, status: InvoiceStatus.UNPAID, dueDate: due, lines: { create: lines } },
    });
    created++;
  }
  return { created, skipped };
}

/** Adds a discount (percent or fixed) for a student for a term; updates an existing invoice if there is one. */
export async function applyDiscount(input: { studentId: string; termId: string; type: "PERCENT" | "FIXED"; value: number; reason: string }) {
  await db.$transaction(async (tx) => {
    await tx.discount.create({ data: { studentId: input.studentId, termId: input.termId, type: input.type, value: input.value, reason: input.reason } });
    const invoice = await tx.invoice.findUnique({ where: { studentId_termId: { studentId: input.studentId, termId: input.termId } }, include: { lines: { where: { feeItemId: { not: null } } } } });
    if (!invoice) return;
    const gross = invoice.lines.reduce((s, l) => s + l.amountKobo, 0);
    const amount = input.type === "PERCENT" ? -Math.round((gross * input.value) / 100) : -input.value;
    await tx.invoiceLine.create({ data: { invoiceId: invoice.id, description: `Discount: ${input.reason}`, amountKobo: amount } });
    await recalcInvoice(invoice.id, tx);
  });
}

/**
 * Confirms a successful gateway payment. Idempotent: a reference that is already SUCCESS is ignored,
 * so webhook retries and the browser callback can never double-credit an invoice.
 */
export async function confirmGatewayPayment(params: { reference: string; amountKobo: number; paidAt: Date; rawPayload: Prisma.InputJsonValue }): Promise<"CONFIRMED" | "ALREADY_PROCESSED" | "UNKNOWN_REFERENCE" | "AMOUNT_MISMATCH"> {
  const payment = await db.payment.findUnique({ where: { gatewayRef: params.reference } });
  if (!payment) return "UNKNOWN_REFERENCE";
  if (payment.status === PaymentStatus.SUCCESS) return "ALREADY_PROCESSED";
  if (payment.amountKobo !== params.amountKobo) return "AMOUNT_MISMATCH";

  return db.$transaction(async (tx) => {
    // Conditional update: only one caller can move PENDING -> SUCCESS.
    const moved = await tx.payment.updateMany({
      where: { id: payment.id, status: PaymentStatus.PENDING },
      data: { status: PaymentStatus.SUCCESS, paidAt: params.paidAt, rawPayload: params.rawPayload, receiptNo: nextReceiptNo() },
    });
    if (moved.count === 0) return "ALREADY_PROCESSED" as const;
    await recalcInvoice(payment.invoiceId, tx);
    return "CONFIRMED" as const;
  });
}

/** Staff records a cash, POS or transfer payment. Creates a receipt number immediately. */
export async function recordManualPayment(params: { invoiceId: string; amountKobo: number; method: PaymentMethod; recordedById: string }) {
  if (!Number.isInteger(params.amountKobo) || params.amountKobo <= 0) throw new Error("Amount must be a positive number");
  return db.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUniqueOrThrow({ where: { id: params.invoiceId } });
    await recalcInvoice(invoice.id, tx);
    const fresh = await tx.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
    const outstanding = fresh.totalKobo - fresh.paidKobo;
    if (params.amountKobo > outstanding) throw new Error("Amount is more than the outstanding balance");
    const payment = await tx.payment.create({
      data: {
        invoiceId: invoice.id, amountKobo: params.amountKobo, method: params.method, status: PaymentStatus.SUCCESS,
        gatewayRef: generateReference("MAN"), receiptNo: nextReceiptNo(), paidAt: new Date(), recordedById: params.recordedById,
      },
    });
    await recalcInvoice(invoice.id, tx);
    return payment;
  });
}

/** Voids a payment with a reason. Payments are never deleted. */
export async function voidPayment(paymentId: string, reason: string) {
  return db.$transaction(async (tx) => {
    const payment = await tx.payment.findUniqueOrThrow({ where: { id: paymentId } });
    if (payment.status !== PaymentStatus.SUCCESS) throw new Error("Only successful payments can be voided");
    await tx.payment.update({ where: { id: paymentId }, data: { status: PaymentStatus.VOIDED, voidReason: reason } });
    await recalcInvoice(payment.invoiceId, tx);
    return payment;
  });
}

export async function feeSummary(termId: string) {
  const invoices = await db.invoice.findMany({ where: { termId }, include: { student: { include: { class: true } } } });
  const collected = invoices.reduce((s, i) => s + i.paidKobo, 0);
  const billed = invoices.reduce((s, i) => s + i.totalKobo, 0);
  return {
    billed, collected, outstanding: Math.max(0, billed - collected), count: invoices.length,
    paid: invoices.filter((i) => i.status === "PAID").length,
    partial: invoices.filter((i) => i.status === "PARTIAL").length,
    unpaid: invoices.filter((i) => i.status === "UNPAID").length,
  };
}
