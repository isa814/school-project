import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const BASE = "https://api.paystack.co";

function secret(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not configured");
  return key;
}

export type PaystackInitResult = { authorization_url: string; access_code: string; reference: string };

/** Initialize a Paystack transaction. amountKobo is the integer kobo amount. */
export async function initializeTransaction(params: {
  email: string; amountKobo: number; reference: string; callbackUrl: string; metadata: Record<string, string>;
}): Promise<PaystackInitResult> {
  const res = await fetch(`${BASE}/transaction/initialize`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: params.email,
      amount: params.amountKobo,
      reference: params.reference,
      callback_url: params.callbackUrl,
      currency: "NGN",
      channels: ["card", "bank", "ussd", "bank_transfer"],
      metadata: params.metadata,
    }),
    cache: "no-store",
  });
  const body = (await res.json()) as { status: boolean; message: string; data?: PaystackInitResult };
  if (!res.ok || !body.status || !body.data) throw new Error(`Paystack: ${body.message ?? "initialization failed"}`);
  return body.data;
}

export type PaystackVerifyData = { reference: string; status: string; amount: number; currency: string; paid_at: string | null; channel: string };

export async function verifyTransaction(reference: string): Promise<PaystackVerifyData> {
  const res = await fetch(`${BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret()}` },
    cache: "no-store",
  });
  const body = (await res.json()) as { status: boolean; message: string; data?: PaystackVerifyData };
  if (!res.ok || !body.status || !body.data) throw new Error(`Paystack verify: ${body.message ?? "failed"}`);
  return body.data;
}

/** Paystack signs webhooks with HMAC SHA512 of the raw body using the secret key. */
export function isValidPaystackSignature(rawBody: string, signature: string | null): boolean {
  if (!signature || !process.env.PAYSTACK_SECRET_KEY) return false;
  const expected = createHmac("sha512", process.env.PAYSTACK_SECRET_KEY).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
