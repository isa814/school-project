import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Guardian View unlock token: a signed, 30-minute, student-bound token stored in an httpOnly cookie.
 * Stateless so no extra table is needed; the signature uses NEXTAUTH_SECRET.
 */
const TTL_MS = 30 * 60 * 1000;
export const GUARDIAN_COOKIE = "ari_guardian";

function sign(payload: string): string {
  return createHmac("sha256", process.env.NEXTAUTH_SECRET ?? "dev").update(payload).digest("hex");
}

export function createGuardianToken(studentId: string, now = Date.now()): string {
  const payload = `${studentId}.${now + TTL_MS}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyGuardianToken(token: string | undefined, studentId: string, now = Date.now()): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [sid, expStr, sig] = parts;
  const payload = `${sid}.${expStr}`;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return false;
  return sid === studentId && Number(expStr) > now;
}

export const GUARDIAN_TTL_SECONDS = TTL_MS / 1000;
