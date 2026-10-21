import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/** Image uploads: only JPEG, PNG and WebP, up to 2 MB, checked by file signature (not just the browser's claimed type). */
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

type ImageKind = { ext: "jpg" | "png" | "webp"; mime: string };

export function detectImage(bytes: Uint8Array): ImageKind | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { ext: "jpg", mime: "image/jpeg" };
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return { ext: "png", mime: "image/png" };
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) return { ext: "webp", mime: "image/webp" };
  return null;
}

/** Validates a browser File as an allowed image. Returns the bytes and detected type, or throws a readable error. */
export async function readImageUpload(file: File): Promise<{ bytes: Uint8Array; kind: ImageKind }> {
  if (file.size === 0) throw new Error("The file is empty");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Image must be 2 MB or smaller");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = detectImage(bytes);
  if (!kind) throw new Error("Upload a JPEG, PNG or WebP image");
  return { bytes, kind };
}

/**
 * Saves an image under public/uploads/<folder> and returns its public URL.
 * Local disk is fine for this demo. Production should use object storage (S3 or similar).
 */
export async function saveImage(folder: "avatars", bytes: Uint8Array, ext: string): Promise<string> {
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  const name = `${randomUUID()}.${ext}`;
  await writeFile(path.join(dir, name), bytes);
  return `/api/${folder}/${name}`;
}
