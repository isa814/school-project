import { requireAdminPermission } from "@/lib/session";
import { db } from "@/lib/db";
import { createStudentAction } from "@/app/actions/admin";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Select, Textarea } from "@/components/ui";
import { PageHeader } from "@/components/shared/PageHeader";
import { Flash } from "@/components/shared/Flash";

export const dynamic = "force-dynamic";

export default async function NewStudentPage({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  await requireAdminPermission("students:write");
  const classes = await db.class.findMany({ include: { sections: { orderBy: { name: "asc" } } }, orderBy: { sortOrder: "asc" } });

  return (
    <>
      <PageHeader eyebrow="Students" title="Add a student" description="Creates the student record, a login, the guardian record, a family access code and a Guardian PIN." />
      <Flash ok={searchParams.ok} err={searchParams.err} />
      <form action={createStudentAction} className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Student</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div><Label htmlFor="firstName">First name *</Label><Input id="firstName" name="firstName" required minLength={2} /></div>
            <div><Label htmlFor="lastName">Last name *</Label><Input id="lastName" name="lastName" required minLength={2} /></div>
            <div><Label htmlFor="gender">Gender *</Label><Select id="gender" name="gender" required defaultValue=""><option value="" disabled>Choose</option><option>Male</option><option>Female</option></Select></div>
            <div><Label htmlFor="dob">Date of birth</Label><Input id="dob" name="dob" type="date" /></div>
            <div><Label htmlFor="classId">Class *</Label><Select id="classId" name="classId" required defaultValue="">
              <option value="" disabled>Choose class</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></div>
            <div><Label htmlFor="sectionId">Section *</Label><Select id="sectionId" name="sectionId" required defaultValue="">
              <option value="" disabled>Choose section</option>{classes.flatMap((c) => c.sections.map((s) => <option key={s.id} value={s.id}>{c.name} {s.name}</option>))}</Select></div>
            <div className="sm:col-span-2"><Label htmlFor="previousSchool">Previous school</Label><Input id="previousSchool" name="previousSchool" /></div>
            <div><Label htmlFor="bloodGroup">Blood group</Label><Input id="bloodGroup" name="bloodGroup" placeholder="O+" maxLength={5} /></div>
            <div><Label htmlFor="allergies">Allergies</Label><Input id="allergies" name="allergies" placeholder="None known" /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Guardian</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label htmlFor="guardianName">Guardian name *</Label><Input id="guardianName" name="guardianName" required minLength={3} /></div>
            <div><Label htmlFor="guardianRelationship">Relationship *</Label><Select id="guardianRelationship" name="guardianRelationship" required defaultValue="Father"><option>Father</option><option>Mother</option><option>Guardian</option><option>Uncle</option><option>Aunt</option></Select></div>
            <div><Label htmlFor="guardianPhone">Phone *</Label><Input id="guardianPhone" name="guardianPhone" type="tel" required minLength={10} /></div>
            <div className="sm:col-span-2"><Label htmlFor="guardianEmail">Email</Label><Input id="guardianEmail" name="guardianEmail" type="email" /></div>
            <div className="sm:col-span-2"><Label htmlFor="guardianAddress">Address</Label><Textarea id="guardianAddress" name="guardianAddress" /></div>
            <div className="sm:col-span-2 flex justify-end"><Button type="submit" size="lg">Create student</Button></div>
          </CardContent>
        </Card>
      </form>
    </>
  );
}
