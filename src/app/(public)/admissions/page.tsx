import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { Section, SectionTitle } from "@/components/public/Section";
import { buttonVariants } from "@/components/ui";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Admissions", description: "Requirements, process, fees and dates for admission to Ansar Ruhul Islam School." };

export default function AdmissionsPage() {
  return (
    <>
      <div className="lattice-navy text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky">Admissions</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Join the Ansar family</h1>
          <p className="mt-4 max-w-2xl text-white/85">Admissions for the 2026/2027 session are open for JSS1 to SS3.</p>
          <Link href="/admissions/apply" className={cn(buttonVariants({ variant: "sky", size: "lg" }), "mt-8")}>Start your application</Link>
        </div>
      </div>

      <Section>
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionTitle eyebrow="Requirements" title="What you need" />
            <ul className="space-y-3">
              {["Birth certificate or age declaration", "Passport photograph of the applicant", "Last school report card (where available)", "Parent or guardian's phone number and address", "Entrance assessment (scheduled after application review)"].map((r) => (
                <li key={r} className="flex gap-3 text-slate-700"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-navy" aria-hidden /> {r}</li>
              ))}
            </ul>
          </div>
          <div>
            <SectionTitle eyebrow="Process" title="How it works" />
            <ol className="space-y-4">
              {["Complete the online application form.", "Receive an application reference (for example ARI-2026-00123).", "Track your status with the reference on the admissions status page.", "Attend the entrance assessment and interview.", "Receive your admission letter and complete enrolment."].map((s, i) => (
                <li key={s} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy font-semibold text-white">{i + 1}</span>
                  <span className="pt-1 text-slate-700">{s}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Section>

      <Section className="bg-sky-soft/50">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-7 shadow-card">
            <h2 className="font-display text-2xl font-semibold text-navy-deep">Fees overview</h2>
            {/* TODO: confirm official fee schedule before publishing. Figures below mirror the demo fee structure. */}
            <p className="mt-2 text-sm text-slate-600">Indicative first-term fees (demo values, confirm before publishing):</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex justify-between border-b border-navy/10 pb-2"><span>Junior (JSS1–JSS3) tuition</span><span className="font-semibold">₦120,000</span></li>
              <li className="flex justify-between border-b border-navy/10 pb-2"><span>Senior (SS1–SS3) tuition</span><span className="font-semibold">₦150,000</span></li>
              <li className="flex justify-between border-b border-navy/10 pb-2"><span>Registration</span><span className="font-semibold">₦10,000</span></li>
              <li className="flex justify-between"><span>Examination</span><span className="font-semibold">₦15,000–₦18,000</span></li>
            </ul>
          </div>
          <div className="rounded-2xl bg-white p-7 shadow-card">
            <h2 className="font-display text-2xl font-semibold text-navy-deep">Important dates</h2>
            {/* TODO: replace with the official admissions calendar */}
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              <li><strong>Applications open:</strong> September 2026</li>
              <li><strong>Entrance assessment:</strong> to be announced</li>
              <li><strong>Resumption for First Term:</strong> Monday, 14 September 2026</li>
            </ul>
          </div>
        </div>
      </Section>
    </>
  );
}
