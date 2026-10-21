import { requirePermission } from "@/lib/session";
import { db } from "@/lib/db";
import { createAnnouncementAction } from "@/app/actions/admin";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Input, Label, Select, Textarea } from "@/components/ui";
import { PageHeader } from "@/components/shared/PageHeader";
import { Flash } from "@/components/shared/Flash";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  await requirePermission("announcements:write");
  const [items, classes] = await Promise.all([
    db.announcement.findMany({ orderBy: { publishedAt: "desc" }, take: 30, include: { createdBy: { select: { email: true } } } }),
    db.class.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  return (
    <>
      <PageHeader title="Announcements" description="Publish notices for everyone, staff only, students, parents, or one class. Students also receive a bell notification." />
      <Flash ok={searchParams.ok} err={searchParams.err} />
      <div className="grid gap-6 xl:grid-cols-[1fr_1.3fr]">
        <Card>
          <CardHeader><CardTitle>New announcement</CardTitle></CardHeader>
          <CardContent>
            <form action={createAnnouncementAction} className="grid gap-4">
              <div><Label htmlFor="title">Title *</Label><Input id="title" name="title" required minLength={4} maxLength={140} /></div>
              <div><Label htmlFor="body">Message *</Label><Textarea id="body" name="body" required minLength={4} maxLength={4000} /></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label htmlFor="audience">Audience</Label><Select id="audience" name="audience" defaultValue="ALL"><option value="ALL">Everyone</option><option value="STAFF">Staff</option><option value="STUDENTS">Students</option><option value="PARENTS">Parents</option><option value="CLASS">One class</option></Select></div>
                <div><Label htmlFor="classId">Class (for one-class audience)</Label><Select id="classId" name="classId" defaultValue=""><option value="">—</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></div>
              </div>
              <Button type="submit">Publish</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Published</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y divide-navy/5">
              {items.map((a) => (
                <li key={a.id} className="py-3">
                  <div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-navy-deep">{a.title}</p><Badge tone="sky">{a.audience.toLowerCase()}</Badge></div>
                  <p className="mt-1 text-sm text-slate-600">{a.body}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(a.publishedAt)} · {a.createdBy.email}</p>
                </li>
              ))}
              {items.length === 0 && <li className="py-3 text-sm text-slate-500">No announcements yet.</li>}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
