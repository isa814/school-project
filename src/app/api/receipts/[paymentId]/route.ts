import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { can } from "@/lib/permissions";
import { receiptPdf } from "@/lib/services/pdf";

export async function GET(_req: Request, { params }: { params: { paymentId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const payment = await db.payment.findUnique({ where: { id: params.paymentId }, include: { invoice: { include: { student: { select: { userId: true } } } } } });
  if (!payment) return NextResponse.json({ error: "not found" }, { status: 404 });
  const allowed = payment.invoice.student.userId === user.id || can(user, "fees:read");
  if (!allowed) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const pdf = await receiptPdf(payment.id);
  return new NextResponse(Buffer.from(pdf), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="receipt-${payment.receiptNo ?? payment.id}.pdf"` },
  });
}
