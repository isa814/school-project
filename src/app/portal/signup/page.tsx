import Link from "next/link";
import type { Metadata } from "next";
import { listClasses } from "@/lib/services/academics";
import { submitSignupAction } from "@/app/actions/signup";
import { Flash } from "@/components/shared/Flash";
import { Card, CardContent, Input, Label, Select, SubmitButton } from "@/components/ui";
import { PortalFrame } from "@/components/portal/PortalFrame";

export const metadata: Metadata = { title: "Create a student account", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function SignupPage({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  const classes = await listClasses();
  return (
    <PortalFrame title="Create a student account" description="Students request an account here. The school office reviews every request before the account is activated.">
      <Flash ok={searchParams.ok} err={searchParams.err} />
      <Card className="mx-auto max-w-3xl">
        <CardContent className="pt-6">
          <form action={submitSignupAction} className="grid gap-5 sm:grid-cols-2">
            <div><Label htmlFor="firstName">First name *</Label><Input id="firstName" name="firstName" required minLength={2} autoComplete="given-name" /></div>
            <div><Label htmlFor="lastName">Last name *</Label><Input id="lastName" name="lastName" required minLength={2} autoComplete="family-name" /></div>
            <div><Label htmlFor="gender">Gender *</Label><Select id="gender" name="gender" required defaultValue=""><option value="" disabled>Choose</option><option>Male</option><option>Female</option></Select></div>
            <div><Label htmlFor="dob">Date of birth</Label><Input id="dob" name="dob" type="date" /></div>
            <div><Label htmlFor="desiredClassId">Class you are applying for</Label>
              <Select id="desiredClassId" name="desiredClassId" defaultValue=""><option value="">Not sure yet</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
            </div>
            <div><Label htmlFor="previousSchool">Previous school</Label><Input id="previousSchool" name="previousSchool" /></div>
            <div><Label htmlFor="email">Email address *</Label><Input id="email" name="email" type="email" required autoComplete="email" /></div>
            <div><Label htmlFor="phone">Phone number *</Label><Input id="phone" name="phone" type="tel" required autoComplete="tel" /></div>
            <div><Label htmlFor="guardianName">Parent or guardian name *</Label><Input id="guardianName" name="guardianName" required minLength={3} /></div>
            <div><Label htmlFor="guardianRelationship">Relationship *</Label><Input id="guardianRelationship" name="guardianRelationship" required placeholder="e.g. Father" /></div>
            <div className="sm:col-span-2"><Label htmlFor="guardianPhone">Guardian phone *</Label><Input id="guardianPhone" name="guardianPhone" type="tel" required /></div>
            <div><Label htmlFor="password">Choose a password *</Label><Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" /></div>
            <div><Label htmlFor="confirm">Confirm password *</Label><Input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" /></div>
            <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3 pt-2">
              <Link href="/portal/login" className="focus-ring rounded text-sm font-semibold text-navy hover:underline">Already have an account? Sign in</Link>
              <SubmitButton pendingText="Sending request…">Submit request</SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </PortalFrame>
  );
}
