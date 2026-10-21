import "server-only";
import { cookies } from "next/headers";

/**
 * One-time credential hand-off. After creating a login, the admin sees the temporary password once.
 * Stored in a short-lived httpOnly cookie that the next page read clears.
 */
export const CRED_COOKIE = "ari_new_credentials";

export function setOneTimeCredentials(payload: Record<string, string>) {
  cookies().set(CRED_COOKIE, Buffer.from(JSON.stringify(payload)).toString("base64url"), {
    httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 120,
  });
}

/** Read-only (safe in Server Components). Cookies are cleared by the dismiss action or expire after 120s. */
export function readOneTimeCredentials(): Record<string, string> | null {
  const raw = cookies().get(CRED_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as Record<string, string>;
  } catch {
    return null;
  }
}

export function clearOneTimeCredentials() {
  cookies().delete(CRED_COOKIE);
}
