import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

/** Writes an audit entry. Never throws: auditing must not break the user's action. */
export async function logActivity(params: {
  userId?: string | null;
  action: string;
  entity?: string;
  entityId?: string;
  meta?: Prisma.InputJsonValue;
  ip?: string | null;
}): Promise<void> {
  try {
    await db.activityLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        meta: params.meta ?? Prisma.JsonNull,
        ip: params.ip ?? null,
      },
    });
  } catch (error) {
    console.error("[activity] failed to log", params.action, error);
  }
}
