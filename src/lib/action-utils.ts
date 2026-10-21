import { redirect } from "next/navigation";
import { z } from "zod";

/** Reads a trimmed string from FormData. */
export function fstr(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export function fnum(fd: FormData, key: string): number {
  return Number(fstr(fd, key));
}

export function withParams(path: string, params: Record<string, string>): string {
  const url = new URL(path, "http://local");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return `${url.pathname}${url.search}`;
}

/**
 * Runs an action body and redirects back to `path` with ?ok= or ?err=.
 * Keeps every server action's feedback consistent without client JS.
 */
export async function runAction(path: string, body: () => Promise<string | undefined>): Promise<never> {
  let message: string;
  try {
    message = (await body()) ?? "Saved";
  } catch (error) {
    // Let Next.js redirects (e.g. auth guards inside body) pass through untouched.
    if (error && typeof error === "object" && "digest" in error && String(error.digest).startsWith("NEXT_REDIRECT")) throw error;
    if (error instanceof z.ZodError) {
      const first = error.issues[0];
      redirect(withParams(path, { err: `${first.path.join(".") || "Input"}: ${first.message}` }));
    }
    const text = error instanceof Error ? error.message : "Something went wrong";
    const friendly = text === "FORBIDDEN" ? "You do not have permission to do that." : text;
    redirect(withParams(path, { err: friendly.slice(0, 220) }));
  }
  redirect(withParams(path, { ok: message }));
}
