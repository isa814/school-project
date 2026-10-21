import type { Metadata } from "next";
import { FileText, Download } from "lucide-react";
import { Section, SectionTitle } from "@/components/public/Section";

export const metadata: Metadata = { title: "School policies", description: "Downloadable school policies and handbooks." };

// TODO: attach the real policy PDFs to /public/policies/ and update the file names below.
const POLICIES = ["Student Handbook 2026/2027", "Code of Conduct", "Uniform and Dress Code Policy", "Fees and Refund Policy", "Child Protection Policy", "Admissions Policy"];

export default function PoliciesPage() {
  return (
    <Section>
      <SectionTitle eyebrow="Policies" title="School policies and handbooks" description="Placeholder documents. Official PDFs will be uploaded by the school office." />
      <ul className="grid gap-4 md:grid-cols-2">
        {POLICIES.map((p) => (
          <li key={p} className="flex items-center justify-between gap-4 rounded-2xl border border-navy/10 bg-white p-5 shadow-card">
            <span className="flex items-center gap-3 font-medium text-navy-deep"><FileText className="h-5 w-5 text-navy" aria-hidden /> {p}</span>
            <span className="inline-flex items-center gap-1.5 text-sm text-slate-500"><Download className="h-4 w-4" aria-hidden /> Coming soon</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
