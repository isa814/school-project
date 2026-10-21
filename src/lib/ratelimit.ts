import { db } from "@/lib/db";

/**
 * Fixed-window rate limiter backed by Postgres.
 * Returns true if the action is allowed, false if the limit has been reached.
 */
export async function consumeRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const now = new Date();
  const existing = await db.rateLimit.findUnique({ where: { key } });
  if (!existing || existing.windowEnd < now) {
    await db.rateLimit.upsert({
      where: { key },
      create: { key, count: 1, windowEnd: new Date(now.getTime() + windowMs) },
      update: { count: 1, windowEnd: new Date(now.getTime() + windowMs) },
    });
    return true;
  }
  if (existing.count >= limit) return false;
  await db.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
  return true;
}

export async function resetRateLimit(key: string): Promise<void> {
  await db.rateLimit.deleteMany({ where: { key } });
}
