import { requireAdminPermission } from "@/lib/session";
import { db } from "@/lib/db";
import { approveAdmissionAction, reviewAdmissionAction } from "@/app/actions/admin";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Select } from "@/components/ui";
import { PageHeader } from "@/components/shared/PageHeader";
import { Flash } from "@/components/shared/Flash";
import { formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";

export const dynamic = "force-dynamic";

const TONE = { SUBMITTED: "sky", UNDER_REVIEW: "amber", APPROVED: "green", REJECTED: "red" } as const;

export default async function AdmissionsAdminPage({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  await requireAdminPermission("admissions:review");
  const [apps, sections] = await Promise.all([
    db.admissionApplication.findMany({ orderBy: { createdAt: "desc" } }),
    db.section.findMany({ include: { class: true }, orderBy: [{ class: { sortOrder: "asc" } }, { name: "asc" }] }),
  ]);

  return (
    <>
      <PageHeader title="Admissions" description="Review online applications. Approving creates the student record, login and guardian details in one step." />
      <Flash ok={searchParams.ok} err={searchParams.err} />
      {apps.length === 0 && <EmptyState title="No applications" description="Applications submitted on the website will appear here." />}
      <div className="grid gap-5">
        {apps.map((a) => (
          <Card key={a.id}>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>{a.applicantName}</CardTitle>
                <Badge tone={TONE[a.status]}>{a.status.toLowerCase().replace("_", " ")}</Badge>
              </div>
              <p className="text-sm text-slate-600">{a.reference} · applying for {a.classApplyingFor} · {a.gender} · submitted {formatDate(a.createdAt)}</p>
            </CardHeader>
            <CardContent className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-1 text-sm text-slate-700">
                <p><span className="text-slate-500">Guardian:</span> {a.guardianName}</p>
                <p><span className="text-slate-500">Phone:</span> {a.guardianPhone} · {a.guardianEmail ?? "no email"}</p>
                <p><span className="text-slate-500">Address:</span> {a.address}</p>
                <p><span className="text-slate-500">Previous school:</span> {a.previousSchool ?? "—"}</p>
              </div>
              {a.status !== "APPROVED" && a.status !== "REJECTED" && (
                <div className="space-y-4">
                  <form action={reviewAdmissionAction} className="flex flex-wrap gap-2">
                    <input type="hidden" name="applicationId" value={a.id} />
                    <Button type="submit" name="status" value="UNDER_REVIEW" variant="outline" size="sm">Mark under review</Button>
                    <Button type="submit" name="status" value="REJECTED" variant="danger" size="sm">Reject</Button>
                  </form>
                  <form action={approveAdmissionAction} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="applicationId" value={a.id} />
                    <div>
                      <label htmlFor={`sec-${a.id}`} className="mb-1 block text-xs font-semibold text-slate-600">Place in section</label>
                      <Select id={`sec-${a.id}`} name="sectionId" required defaultValue="" className="w-44">
                        <option value="" disabled>Choose</option>
                        {sections.filter((s) => s.class.name === a.classApplyingFor).map((s) => <option key={s.id} value={s.id}>{s.class.name} {s.name}</option>)}
                      </Select>
                    </div>
                    <Button type="submit" variant="gold">Approve &amp; enrol</Button>
                  </form>
                </div>
              )}
              {a.status === "APPROVED" && <p className="text-sm text-emerald-800">Approved and enrolled. The student record has been created.</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
