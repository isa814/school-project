import "server-only";
import { AnnouncementAudience, ModerationStatus, type Prisma, type UserRole } from "@prisma/client";
import { db } from "@/lib/db";

/** Announcements visible to a user, based on role and (for students) their class. */
export async function announcementsFor(user: { role: UserRole; id: string }, limit = 6) {
  let audiences: AnnouncementAudience[] = [AnnouncementAudience.ALL];
  let classId: string | undefined;
  if (user.role === "STUDENT") {
    audiences = [AnnouncementAudience.ALL, AnnouncementAudience.STUDENTS, AnnouncementAudience.CLASS];
    const st = await db.student.findUnique({ where: { userId: user.id }, select: { classId: true } });
    classId = st?.classId;
  } else if (user.role === "TEACHER" || user.role === "ADMIN") {
    audiences = [AnnouncementAudience.ALL, AnnouncementAudience.STAFF, AnnouncementAudience.CLASS];
  }
  const where: Prisma.AnnouncementWhereInput = {
    audience: { in: audiences },
    ...(user.role === "STUDENT" ? { OR: [{ audience: { not: AnnouncementAudience.CLASS } }, { classId }] } : {}),
  };
  return db.announcement.findMany({ where, orderBy: { publishedAt: "desc" }, take: limit, include: { createdBy: { select: { email: true } } } });
}

export async function createAnnouncement(input: { title: string; body: string; audience: AnnouncementAudience; classId?: string | null; createdById: string }) {
  const ann = await db.announcement.create({ data: { title: input.title, body: input.body, audience: input.audience, classId: input.classId ?? null, createdById: input.createdById } });
  // Notify matching students (in-app notifications for the bell).
  if (input.audience === "ALL" || input.audience === "STUDENTS" || input.audience === "CLASS") {
    const students = await db.student.findMany({
      where: { deletedAt: null, status: "ACTIVE", ...(input.audience === "CLASS" && input.classId ? { classId: input.classId } : {}) },
      select: { userId: true },
    });
    await db.notification.createMany({ data: students.map((s) => ({ userId: s.userId, title: "New announcement", body: input.title, link: "/portal/student" })) });
  }
  return ann;
}

export async function notificationsFor(userId: string, limit = 10) {
  return db.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: limit });
}

export async function markNotificationsRead(userId: string) {
  await db.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
}

/** Email and SMS are interfaces with console implementations until a provider is configured. */
export interface Mailer { send(to: string, subject: string, text: string): Promise<void> }
export interface SmsSender { send(to: string, text: string): Promise<void> }

export const consoleMailer: Mailer = {
  async send(to, subject, text) {
    console.info(`[mail:console] to=${to} subject="${subject}"\n${text}`);
  },
};
export const consoleSms: SmsSender = {
  async send(to, text) {
    console.info(`[sms:console] to=${to} text="${text}"`);
  },
};

export async function approvedThreads() {
  return db.forumThread.findMany({
    where: { status: ModerationStatus.APPROVED },
    orderBy: { createdAt: "desc" },
    include: { replies: { where: { status: ModerationStatus.APPROVED }, orderBy: { createdAt: "asc" } } },
    take: 50,
  });
}

export async function threadsForFamily(code: string) {
  return db.forumThread.findMany({
    where: { familyAccessCode: code },
    orderBy: { createdAt: "desc" },
    include: { replies: { orderBy: { createdAt: "asc" } } },
  });
}

export async function isValidFamilyCode(code: string): Promise<boolean> {
  const hit = await db.student.findUnique({ where: { familyAccessCode: code.trim().toUpperCase() }, select: { id: true } });
  return !!hit;
}
