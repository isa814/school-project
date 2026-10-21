import Link from "next/link";
import type { Metadata } from "next";
import { GraduationCap, BookOpenCheck, ShieldCheck, UserPlus } from "lucide-react";
import { LoginForm } from "./LoginForm";
import { Logo } from "@/components/shared/Logo";
import { PageTransition, Reveal, Float } from "@/components/motion/Motion";

export const metadata: Metadata = { title: "Portal sign in", robots: { index: false } };

export default function LoginPage({ searchParams }: { searchParams: { callbackUrl?: string } }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="lattice-navy relative flex flex-col justify-between overflow-hidden p-8 text-white sm:p-12">
        <Logo tone="light" href="/portal/login" />
        <PageTransition className="my-12 max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky">School portal</p>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight">Sign in to your portal</h1>
          <p className="mt-4 text-white/85">
            Administrators, teachers and students sign in here. Parents follow a child&apos;s progress through the student&apos;s Guardian View.
          </p>
          <ul className="mt-8 space-y-4 text-sm">
            <li className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-sky" aria-hidden /> Role-based access for admin, teachers and students</li>
            <li className="flex items-center gap-3"><BookOpenCheck className="h-5 w-5 text-sky" aria-hidden /> Results, attendance, timetables and report cards</li>
            <li className="flex items-center gap-3"><GraduationCap className="h-5 w-5 text-sky" aria-hidden /> Secure online school fee payments</li>
          </ul>
        </PageTransition>
        <Float className="pointer-events-none absolute -bottom-16 -right-10 hidden h-64 w-64 rounded-full border border-sky/20 lg:block" amount={10}>
          <span className="block h-full w-full" />
        </Float>
        <p className="relative text-xs text-sky/80">Knowledge is light · Ansar Ruhul Islam School</p>
      </section>

      <section className="flex items-center justify-center bg-white p-6 sm:p-12">
        <Reveal className="w-full max-w-md">
          <LoginForm callbackUrl={searchParams.callbackUrl} />
          <div className="mt-8 rounded-2xl border border-navy/10 bg-sky-soft/60 p-5">
            <p className="flex items-center gap-2 font-semibold text-navy-deep"><UserPlus className="h-4 w-4" aria-hidden /> New student?</p>
            <p className="mt-1 text-sm text-slate-600">Request a student account. The school office approves it before you can sign in.</p>
            <Link href="/portal/signup" className="focus-ring mt-3 inline-flex rounded-lg text-sm font-semibold text-navy hover:underline">Create a student account →</Link>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
