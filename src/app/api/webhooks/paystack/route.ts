import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isValidPaystackSignature } from "@/lib/services/paystack";
import { confirmGatewayPayment } from "@/lib/services/fees";
import { logActivity } from "@/lib/activity";

export const runtime = "nodejs";

const chargeSchema = z.object({
  event: z.string(),
  data: z.object({
    reference: z.string(),
    amount: z.number().int().nonnegative(),
    status: z.string(),
    paid_at: z.string().nullable().optional(),
  }),
});

/**
 * Paystack webhook: the source of truth for payment status.
 * 1. Reject anything whose HMAC-SHA512 signature does not match the secret key.
 * 2. Handle charge.success idempotently: duplicate deliveries are acknowledged but not re-applied.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("x-paystack-signature");
  if (!isValidPaystackSignature(raw, signature)) {
    await logActivity({ action: "WEBHOOK_SIGNATURE_REJECTED", entity: "Payment", meta: { length: raw.length } });
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let parsed: z.infer<typeof chargeSchema>;
  try {
    parsed = chargeSchema.parse(JSON.parse(raw));
  } catch {
    return NextResponse.json({ error: "bad payload" }, { status: 400 });
  }

  if (parsed.event !== "charge.success" || parsed.data.status !== "success") {
    return NextResponse.json({ ok: true, ignored: parsed.event });
  }

  const result = await confirmGatewayPayment({
    reference: parsed.data.reference,
    amountKobo: parsed.data.amount,
    paidAt: parsed.data.paid_at ? new Date(parsed.data.paid_at) : new Date(),
    rawPayload: JSON.parse(raw),
  });
  await logActivity({ action: `WEBHOOK_CHARGE_${result}`, entity: "Payment", meta: { reference: parsed.data.reference } });
  return NextResponse.json({ ok: true, result });
}
