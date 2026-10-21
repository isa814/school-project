import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { logActivity } from "@/lib/activity";
import { readImageUpload, saveImage } from "@/lib/uploads";

const targetSchema = z.string().uuid().optional();

/**
 * Profile photo upload. Everyone can change their own photo.
 * Admins may also change another user's photo (for example a teacher or student record).
 */
export async function POST(req: NextRequest) {
  const actor = await getCurrentUser();
  if (!actor) return NextResponse.json({ error: "Sign in to upload a photo" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Send the photo as a form upload" }, { status: 400 });

  const targetParse = targetSchema.safeParse(form.get("userId") ?? undefined);
  if (!targetParse.success) return NextResponse.json({ error: "Invalid user" }, { status: 400 });
  const targetId = targetParse.data ?? actor.id;
  if (targetId !== actor.id && actor.role !== "ADMIN") {
    return NextResponse.json({ error: "You can only change your own photo" }, { status: 403 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose an image to upload" }, { status: 400 });

  try {
    const { bytes, kind } = await readImageUpload(file);
    const url = await saveImage("avatars", bytes, kind.ext);
    const target = await db.user.update({ where: { id: targetId }, data: { avatarUrl: url }, select: { id: true } });
    await logActivity({ userId: actor.id, action: "AVATAR_UPDATED", entity: "User", entityId: target.id });
    revalidatePath("/portal", "layout");
    return NextResponse.json({ ok: true, url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
