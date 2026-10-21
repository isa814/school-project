import type { Metadata } from "next";
import { Section } from "@/components/public/Section";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <Section className="prose prose-slate max-w-3xl">
      <h1 className="font-display text-4xl font-semibold text-navy-deep">Privacy policy</h1>
      {/* TODO: have legal counsel review this placeholder against the Nigeria Data Protection Act 2023 (NDPA) and NDPR guidance. */}
      <p>This is placeholder text. It explains how Ansar Ruhul Islam School collects, uses and protects personal data of applicants, students, parents and staff in line with the Nigeria Data Protection Act 2023.</p>
      <h2>What we collect</h2>
      <p>Applicant and student details, parent or guardian contact information, academic records, attendance, fee payments and medical information that parents choose to share for student welfare.</p>
      <h2>How we use it</h2>
      <p>To process admissions, deliver teaching, keep parents informed, process fee payments and keep students safe. Medical records are restricted to authorised health and administrative staff, and every access is logged.</p>
      <h2>Payments</h2>
      <p>Card payments are processed by Paystack. The school does not store full card numbers.</p>
      <h2>Your rights</h2>
      <p>You may request access to, correction of, or deletion of your data, subject to legal retention duties. Contact the school office to make a request.</p>
    </Section>
  );
}
