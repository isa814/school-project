import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/shared/Logo";
import { PageTransition } from "@/components/motion/Motion";

/** Standalone portal page chrome (sign-in, sign-up). Deliberately has no school website navigation or footer. */
export function PortalFrame({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-sky-soft/40">
      <header className="border-b border-navy/10 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Logo href="/portal/login" />
          <Link href="/" className="focus-ring rounded text-sm font-semibold text-navy hover:underline">Back to school website</Link>
        </div>
      </header>
      <PageTransition>
        <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy/70">School portal</p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-navy-deep sm:text-4xl">{title}</h1>
            {description && <p className="mt-3 max-w-2xl text-slate-600">{description}</p>}
          </div>
          {children}
        </main>
      </PageTransition>
    </div>
  );
}
