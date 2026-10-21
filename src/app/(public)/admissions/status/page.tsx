import type { Metadata } from "next";
import { lookupApplication } from "@/lib/services/admissions";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Input, Label } from "@/components/ui";
import { Section } from "@/components/public/Section";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Admission status" };

const LABEL: Record<string, { text: string; tone: "navy" | "sky" | "green" | "amber" | "red" | "slate" }> = {
  SUBMITTED: { text: "Submitted", tone: "sky" },
  UNDER_REVIEW: { text: "Under review", tone: "amber" },
  APPROVED: { text: "Approved", tone: "green" },
  REJECTED: { text: "Not successful", tone: "red" },
};

export default async function AdmissionStatusPage({ searchParams }: { searchParams: { ref?: string } }) {
  const ref = searchParams.ref?.trim();
  const app = ref && /^ARI-\d{4}-\d{5}$/i.test(ref) ? await lookupApplication(ref) : null;
  return (
    <Section className="max-w-2xl">
      <h1 className="font-display text-3xl font-semibold text-navy-deep">Check your admission status</h1>
      <p className="mt-2 text-slate-600">Enter the reference number you received after applying.</p>
      <form className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end" method="get">
        <div className="flex-1"><Label htmlFor="ref">Application reference</Label><Input id="ref" name="ref" placeholder="ARI-2026-00123" defaultValue={ref ?? ""} required /></div>
        <Button type="submit">Check status</Button>
      </form>

      {ref && !app && (
        <Card className="mt-8"><CardContent><p className="text-sm text-slate-700">No application matches that reference. Check the number and try again.</p></CardContent></Card>
      )}
      {app && (
        <Card className="mt-8">
          <CardHeader><CardTitle>{app.applicantName}</CardTitle><p className="text-sm text-slate-600">Reference {app.reference} · {app.classApplyingFor}</p></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>Status: <Badge tone={LABEL[app.status].tone}>{LABEL[app.status].text}</Badge></p>
            <p className="text-slate-600">Submitted {formatDate(app.createdAt)} · Last updated {formatDate(app.updatedAt)}</p>
            {app.status === "APPROVED" && <p className="text-slate-700">Congratulations. The school office will contact you with your admission letter and enrolment steps.</p>}
          </CardContent>
        </Card>
      )}
    </Section>
  );
}
