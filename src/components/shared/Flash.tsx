import { Notice } from "@/components/ui";

/** Renders ?ok= / ?err= feedback set by runAction redirects. */
export function Flash({ ok, err }: { ok?: string; err?: string }) {
  return (
    <div className="mb-6 space-y-3">
      {ok && <Notice tone="success">{ok}</Notice>}
      {err && <Notice tone="error">{err}</Notice>}
    </div>
  );
}
