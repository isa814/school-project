import type { Metadata } from "next";
import { submitAdmissionAction } from "@/app/actions/public";
import { Card, CardContent, CardHeader, CardTitle, Input, Label, Notice, Select, Textarea, Button } from "@/components/ui";
import { Section } from "@/components/public/Section";

export const metadata: Metadata = { title: "Apply for admission", description: "Online admission application for Ansar Ruhul Islam School." };

const CLASSES = ["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"];

export default function ApplyPage({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  if (searchParams.ok) {
    // Show the reference after submission. The reference is read from the success message to avoid extra state.
    return (
      <Section className="max-w-2xl">
        <Card>
          <CardHeader><CardTitle>Application received</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Notice tone="success">{searchParams.ok}</Notice>
            <p className="text-slate-700">Our admissions office will review your application. Track progress on the <a className="font-semibold text-navy underline" href="/admissions/status">admission status page</a> using your reference number (ARI-YYYY-NNNNN).</p>
          </CardContent>
        </Card>
      </Section>
    );
  }

  return (
    <>
      <div className="lattice-navy text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <h1 className="font-display text-4xl font-semibold">Admission application</h1>
          <p className="mt-2 max-w-2xl text-white/85">Complete the form below. Fields marked * are required.</p>
        </div>
      </div>
      <Section className="max-w-3xl">
        {searchParams.err && <div className="mb-6"><Notice tone="error">{searchParams.err}</Notice></div>}
        <form action={submitAdmissionAction} className="space-y-6" noValidate={false}>
          {/* Honeypot: hidden from people, filled by bots. */}
          <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
            <label>Website <input name="website" tabIndex={-1} autoComplete="off" /></label>
          </div>

          <Card>
            <CardHeader><CardTitle>1. Applicant details</CardTitle></CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2"><Label htmlFor="applicantName">Full name *</Label><Input id="applicantName" name="applicantName" required minLength={3} /></div>
              <div><Label htmlFor="gender">Gender *</Label><Select id="gender" name="gender" required defaultValue=""><option value="" disabled>Choose</option><option>Male</option><option>Female</option></Select></div>
              <div><Label htmlFor="dob">Date of birth</Label><Input id="dob" name="dob" type="date" /></div>
              <div><Label htmlFor="classApplyingFor">Class applying for *</Label><Select id="classApplyingFor" name="classApplyingFor" required defaultValue=""><option value="" disabled>Choose</option>{CLASSES.map((c) => <option key={c}>{c}</option>)}</Select></div>
              <div><Label htmlFor="previousSchool">Previous school</Label><Input id="previousSchool" name="previousSchool" /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>2. Parent or guardian</CardTitle></CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <div><Label htmlFor="guardianName">Guardian&apos;s full name *</Label><Input id="guardianName" name="guardianName" required minLength={3} /></div>
              <div><Label htmlFor="guardianPhone">Phone number *</Label><Input id="guardianPhone" name="guardianPhone" type="tel" required minLength={10} placeholder="08012345678" /></div>
              <div className="sm:col-span-2"><Label htmlFor="guardianEmail">Email address</Label><Input id="guardianEmail" name="guardianEmail" type="email" /></div>
              <div className="sm:col-span-2"><Label htmlFor="address">Home address *</Label><Textarea id="address" name="address" required minLength={5} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>3. Documents and confirmation</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {/* Document upload is handled at the school office in this version. Upload storage is a Phase 2 item. */}
              <p className="text-sm text-slate-600">You will be asked for original documents (birth certificate, passport photograph, last report card) at the entrance assessment.</p>
              <label className="flex items-start gap-3 text-sm text-slate-700">
                <input type="checkbox" name="consent" className="mt-1 h-4 w-4 accent-navy" required />
                I confirm that the information I have provided is accurate and I consent to its use for admission purposes.
              </label>
            </CardContent>
          </Card>

          <Button type="submit" size="lg" className="w-full sm:w-auto">Submit application</Button>
        </form>
      </Section>
    </>
  );
}
