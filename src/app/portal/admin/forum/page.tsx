import { requirePermission } from "@/lib/session";
import { db } from "@/lib/db";
import { moderateThreadAction, moderateReplyAction } from "@/app/actions/admin";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "@/components/ui";
import { PageHeader } from "@/components/shared/PageHeader";
import { Flash } from "@/components/shared/Flash";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ForumModerationPage({ searchParams }: { searchParams: { ok?: string; err?: string; view?: string } }) {
  await requirePermission("forum:moderate");
  const threads = await db.forumThread.findMany({
    orderBy: { createdAt: "desc" },
    include: { replies: { orderBy: { createdAt: "asc" } } },
    where: searchParams.view === "pending" ? { OR: [{ status: "PENDING" }, { replies: { some: { status: "PENDING" } } }] } : {},
  });
  const pendingCount = threads.filter((t) => t.status === "PENDING").length;

  return (
    <>
      <PageHeader title="Parent Forum moderation" description="Only approved threads and replies are visible on the public forum. Lock threads to stop further replies." actions={
        <div className="flex gap-2 text-sm">
          <a href="/portal/admin/forum" className="focus-ring rounded-lg border border-navy/20 bg-white px-3 py-2 font-medium text-navy">All</a>
          <a href="/portal/admin/forum?view=pending" className="focus-ring rounded-lg border border-navy/20 bg-white px-3 py-2 font-medium text-navy">Pending ({pendingCount})</a>
        </div>
      } />
      <Flash ok={searchParams.ok} err={searchParams.err} />
      <div className="space-y-5">
        {threads.map((t) => (
          <Card key={t.id}>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>{t.title}</CardTitle>
                <Badge tone={t.status === "APPROVED" ? "green" : t.status === "PENDING" ? "amber" : "red"}>{t.status.toLowerCase()}</Badge>
                {t.isLocked && <Badge tone="slate">locked</Badge>}
              </div>
              <p className="text-xs text-slate-500">{t.authorName} · family {t.familyAccessCode} · {formatDate(t.createdAt)}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-700">{t.body}</p>
              <div className="flex flex-wrap gap-2">
                {t.status !== "APPROVED" && <form action={moderateThreadAction}><input type="hidden" name="threadId" value={t.id} /><Button type="submit" name="op" value="APPROVE" size="sm">Approve</Button></form>}
                {t.status !== "REJECTED" && <form action={moderateThreadAction}><input type="hidden" name="threadId" value={t.id} /><Button type="submit" name="op" value="REJECT" size="sm" variant="danger">Reject</Button></form>}
                <form action={moderateThreadAction}><input type="hidden" name="threadId" value={t.id} /><Button type="submit" name="op" value={t.isLocked ? "UNLOCK" : "LOCK"} size="sm" variant="outline">{t.isLocked ? "Unlock" : "Lock thread"}</Button></form>
              </div>
              {t.replies.length > 0 && (
                <ul className="space-y-2 border-l-2 border-sky pl-4">
                  {t.replies.map((r) => (
                    <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 text-sm">
                      <div><span className="font-semibold">{r.authorName}</span> <Badge tone={r.status === "APPROVED" ? "green" : r.status === "PENDING" ? "amber" : "red"}>{r.status.toLowerCase()}</Badge><p className="text-slate-700">{r.body}</p></div>
                      {r.status !== "APPROVED" && (
                        <form action={moderateReplyAction} className="flex gap-2">
                          <input type="hidden" name="replyId" value={r.id} />
                          <Button type="submit" name="op" value="APPROVE" size="sm">Approve reply</Button>
                          <Button type="submit" name="op" value="REJECT" size="sm" variant="outline">Reject</Button>
                        </form>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
        {threads.length === 0 && <p className="text-sm text-slate-500">Nothing to moderate.</p>}
      </div>
    </>
  );
}
