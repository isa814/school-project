import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { consumeRateLimit, resetRateLimit } from "@/lib/ratelimit";

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
});

const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/portal/login" },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const headers = (req?.headers ?? {}) as Record<string, string | string[] | undefined>;
        const forwarded = headers["x-forwarded-for"];
        const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(",")[0]?.trim() ?? null;

        const rateKey = `login:${email}:${ip ?? "unknown"}`;
        const allowed = await consumeRateLimit(rateKey, LOGIN_LIMIT, LOGIN_WINDOW_MS);
        if (!allowed) {
          await logActivity({ action: "LOGIN_BLOCKED", entity: "User", meta: { email }, ip });
          throw new Error("TOO_MANY_ATTEMPTS");
        }

        const user = await db.user.findUnique({
          where: { email },
          include: { student: { select: { firstName: true, lastName: true, deletedAt: true } }, staff: { select: { firstName: true, lastName: true, deletedAt: true } } },
        });
        const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;
        if (!user || !valid || !user.isActive) {
          await logActivity({ action: "LOGIN_FAILED", entity: "User", meta: { email }, ip, userId: user?.id });
          return null;
        }

        await resetRateLimit(rateKey);
        await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        await logActivity({ userId: user.id, action: "LOGIN_SUCCESS", entity: "User", entityId: user.id, ip });

        const profile = user.student ?? user.staff;
        const name = profile ? `${profile.firstName} ${profile.lastName}` : "School Administrator";
        return { id: user.id, email: user.email, name, role: user.role, adminRole: user.adminRole };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.adminRole = user.adminRole;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.id,
        role: token.role,
        adminRole: token.adminRole,
        name: session.user?.name ?? "",
        email: session.user?.email ?? "",
      };
      return session;
    },
  },
};

export const HOME_BY_ROLE = {
  ADMIN: "/portal/admin",
  TEACHER: "/portal/teacher",
  STUDENT: "/portal/student",
} as const;
