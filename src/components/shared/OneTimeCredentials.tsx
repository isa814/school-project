"use client";

import { useState, useTransition } from "react";
import { KeyRound } from "lucide-react";
import { dismissCredentialsAction } from "@/app/actions/admin";
import { Button } from "@/components/ui";

/** Shows temporary credentials exactly once. Dismissing clears the httpOnly cookie. */
export function OneTimeCredentials({ items }: { items: Record<string, string> }) {
  const [hidden, setHidden] = useState(false);
  const [pending, start] = useTransition();
  if (hidden) return null;
  return (
    <div role="alert" className="mb-6 rounded-2xl border border-gold/50 bg-gold-soft p-5">
      <div className="flex items-start gap-3">
        <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-[#7a4f0c]" aria-hidden />
        <div className="flex-1">
          <p className="font-semibold text-navy-deep">Save these login details now. They will not be shown again.</p>
          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
            {Object.entries(items).map(([k, v]) => (
              <div key={k} className="rounded-lg bg-white px-3 py-2">
                <dt className="text-xs uppercase tracking-wide text-slate-500">{k}</dt>
                <dd className="font-mono text-sm font-semibold text-ink">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-slate-600">Ask the user to change this password at first sign-in. The details disappear automatically after two minutes.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => start(async () => { await dismissCredentialsAction(); setHidden(true); })}
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
}
