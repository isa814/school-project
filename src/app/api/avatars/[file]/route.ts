import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

/** Filenames are UUIDs with an image extension. Anything else is rejected before touching the disk. */
const fileSchema = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/);
const MIME: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

/**
 * Serves uploaded avatars from public/uploads/avatars. A route handler is used instead of the
 * static folder so files uploaded while the server is running are served immediately.
 */
export async function GET(_req: Request, { params }: { params: { file: string } }) {
  const parsed = fileSchema.safeParse(params.file);
  if (!parsed.success) return new NextResponse("Not found", { status: 404 });
  const ext = parsed.data.split(".").pop() ?? "";
  try {
    const bytes = await readFile(path.join(process.cwd(), "public", "uploads", "avatars", parsed.data));
    return new NextResponse(bytes, {
      headers: { "Content-Type": MIME[ext], "Cache-Control": "public, max-age=300", "X-Content-Type-Options": "nosniff" },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
