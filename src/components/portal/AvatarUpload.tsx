"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Avatar } from "@/components/portal/Avatar";
import { Button } from "@/components/ui";

const MAX_BYTES = 2 * 1024 * 1024;

/** Lets a user (or an admin, for another user) upload a profile photo with a live preview. */
export function AvatarUpload({ name, currentUrl, userId }: { name: string; currentUrl: string | null; userId?: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function onPick(file: File | undefined) {
    if (!file) return;
    setMessage(null);
    if (file.size > MAX_BYTES) {
      setStatus("error");
      setMessage("Image must be 2 MB or smaller.");
      return;
    }
    setPreview(URL.createObjectURL(file));
    setStatus("uploading");
    const body = new FormData();
    body.append("file", file);
    if (userId) body.append("userId", userId);
    try {
      const res = await fetch("/api/avatar", { method: "POST", body });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Upload failed");
      setStatus("done");
      setMessage("Photo updated.");
      router.refresh();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Upload failed");
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
      <motion.div key={preview ?? currentUrl ?? "none"} initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }}>
        <Avatar name={name} src={preview ?? currentUrl} size={104} />
      </motion.div>
      <div className="space-y-2">
        <p className="font-semibold text-navy-deep">Profile photo</p>
        <p className="text-xs text-slate-500">JPEG, PNG or WebP, up to 2 MB. Until you upload one, your initials are shown.</p>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Choose profile photo" onChange={(e) => onPick(e.target.files?.[0])} />
        <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={status === "uploading"}>
            {status === "uploading" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Camera className="h-4 w-4" aria-hidden />}
            {currentUrl ? "Change photo" : "Upload photo"}
          </Button>
          <AnimatePresence mode="wait">
            {message && (
              <motion.p
                key={message}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className={status === "error" ? "flex items-center gap-1.5 text-sm text-red-700" : "flex items-center gap-1.5 text-sm text-emerald-700"}
                role="status"
              >
                {status === "error" ? <AlertTriangle className="h-4 w-4" aria-hidden /> : <CheckCircle2 className="h-4 w-4" aria-hidden />}
                {message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
