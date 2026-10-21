import type { Metadata } from "next";
import { Section } from "@/components/public/Section";

export const metadata: Metadata = { title: "Terms of use" };

export default function TermsPage() {
  return (
    <Section className="prose prose-slate max-w-3xl">
      <h1 className="font-display text-4xl font-semibold text-navy-deep">Terms of use</h1>
      {/* TODO: replace with terms reviewed by the school's legal adviser. */}
      <p>This is placeholder text. By using the school website and portal you agree to use them lawfully, keep your login details confidential, and respect the privacy and rights of other users.</p>
      <h2>Accounts</h2>
      <p>Accounts are issued by the school. Do not share passwords. Report any suspected misuse to the school office immediately.</p>
      <h2>Parent Forum</h2>
      <p>Forum posts are moderated before publication. Abusive, false or personal content will be removed.</p>
    </Section>
  );
}
