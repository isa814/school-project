import Link from "next/link";
import { cookies } from "next/headers";
import type { Prisma } from "@prisma/client";
import { requirePermission } from "@/lib/session";
import { db } from "@/lib/db";
import { verifyTransaction } from "@/lib/services/paystack";
import { confirmGatewayPayment } from "@/lib/services/fees";
import { GUARDIAN_COOKIE, verifyGuardianToken } from "@/lib/guardian-gate";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, Notice, Badge } from "@/components/ui";
import { formatKobo } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Browser return from Paystack. Verifies the transaction with Paystack's API, then confirms it.
 * The webhook performs the same confirmation, and both paths are idempotent.
 */
export default async function PaymentCallback({ searchParams }: { searchParams: { reference?: string; trxref?: string } }) {
  const user = await requirePermission("pay:own");
  const reference = searchParams.reference ?? searchParams.trxref;
  if (!reference) return <Notice tone="error">No payment reference was returned. If you were charged, contact the bursary with your bank receipt.</Notice>;

  const payment = await db.payment.findUnique({ where: { gatewayRef: reference }, include: { invoice: { include: { student: true } } } });
  if (!payment) return <Notice tone="error">We could not find this payment. Contact the bursary with reference {reference}.</Notice>;
  const isOwner = payment.invoice.student.userId === user.id;
  const isGuardian = verifyGuardianToken(cookies().get(GUARDIAN_COOKIE)?.value, payment.invoice.studentId);
  if (!isOwner && !isGuardian) return <Notice tone="error">This payment does not belong to your account.</Notice>;

  let outcome = "";
  let errorText: string | null = null;
  if (payment.status !== "SUCCESS") {
    try {
      const verified = await verifyTransaction(reference);
      if (verified.status === "success") {
        outcome = await confirmGatewayPayment({
          reference,
          amountKobo: verified.amount,
          paidAt: verified.paid_at ? new Date(verified.paid_at) : new Date(),
          rawPayload: JSON.parse(JSON.stringify(verified)) as Prisma.InputJsonValue,
        });
      } else {
        outcome = "NOT_SUCCESSFUL";
      }
    } catch (error) {
      errorText = error instanceof Error ? error.message : "Verification failed";
    }
  }
  const fresh = await db.payment.findUnique({ where: { id: payment.id } });
  const succeeded = fresh?.status === "SUCCESS";

  return (
    <>
      <PageHeader eyebrow="Payment" title={succeeded ? "Payment received" : "Payment status"} />
      <Card className="max-w-2xl">
        <CardContent className="space-y-4 pt-6 text-sm">
          <div className="flex items-center gap-3">
            <Badge tone={succeeded ? "green" : outcome === "NOT_SUCCESSFUL" ? "red" : "amber"}>{succeeded ? "Successful" : fresh?.status.toLowerCase() ?? "pending"}</Badge>
            <span className="text-slate-600">Reference {reference}</span>
          </div>
          <p>Amount: <strong>{formatKobo(payment.amountKobo)}</strong></p>
          {succeeded && <p>Your receipt number is <strong>{fresh?.receiptNo}</strong>. Thank you.</p>}
          {!succeeded && outcome === "NOT_SUCCESSFUL" && <p>Paystack did not confirm this payment. You have not been charged for it. You can try again.</p>}
          {!succeeded && outcome !== "NOT_SUCCESSFUL" && !errorText && <p>Paystack has not yet confirmed this payment. It will update automatically; refresh this page shortly.</p>}
          {errorText && <Notice tone="error">{errorText}</Notice>}
          {outcome === "AMOUNT_MISMATCH" && <Notice tone="error">The amount charged does not match the payment record. The bursary has been asked to review it.</Notice>}
          <div className="flex flex-wrap gap-3 pt-2">
            {succeeded && <a href={`/api/receipts/${payment.id}`} className="focus-ring rounded-xl bg-navy px-4 py-2 font-semibold text-white hover:bg-navy-deep">Download receipt</a>}
            <Link href="/portal/student/fees" className="focus-ring rounded-xl border border-navy/20 px-4 py-2 font-semibold text-navy hover:bg-sky-soft">Back to fees</Link>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
