import type { Metadata } from "next";
import { forumThreadAction, forumReplyAction } from "@/app/actions/public";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Input, Label, Notice, Textarea } from "@/components/ui";
import { Section, SectionTitle } from "@/components/public/Section";
import { isValidFamilyCode, threadsForFamily } from "@/lib/services/communications";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { withDbFallback } from "@/lib/db-fallback";

export const metadata: Metadata = { title: "Parent Forum", description: "A moderated space for parents of Ansar Ruhul Islam School." };
export const dynamic = "force-dynamic";

export default async function ForumPage({ searchParams }: { searchParams: { code?: string; ok?: string; err?: string } }) {
  const code = searchParams.code?.trim().toUpperCase() ?? "";
  const hasAccess = code ? await withDbFallback(isValidFamilyCode(code), false, "Forum access check") : false;
  const threads = hasAccess
    ? await withDbFallback(threadsForFamily(code), [], "Family forum")
    : [];
  // Public threads: approved only, from every family.
  const publicThreads = await withDbFallback(db.forumThread.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    include: { replies: { where: { status: "APPROVED" }, orderBy: { createdAt: "asc" } } },
    take: 50,
  }), [], "Public forum");

  return (
    <>
      <div className="lattice-navy text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky">Parent Forum</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Ask, share and support one another</h1>
          <p className="mt-4 max-w-2xl text-white/85">Parents post with their family access code, issued at admission. Every post is reviewed before it appears.</p>
        </div>
      </div>

      <Section>
        {searchParams.ok && <div className="mb-6"><Notice tone="success">{searchParams.ok}</Notice></div>}
        {searchParams.err && <div className="mb-6"><Notice tone="error">{searchParams.err}</Notice></div>}

        <Card className="max-w-xl">
          <CardHeader><CardTitle>Family access</CardTitle></CardHeader>
          <CardContent>
            <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1"><Label htmlFor="code">Family access code</Label><Input id="code" name="code" placeholder="FAM-123456" defaultValue={code} required /></div>
              <Button type="submit">Continue</Button>
            </form>
            {code && !hasAccess && <p className="mt-3 text-sm text-red-700">That code was not recognised. Contact the school office for your family code.</p>}
          </CardContent>
        </Card>

        {hasAccess && (
          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.3fr]">
            <Card>
              <CardHeader><CardTitle>Start a new thread</CardTitle></CardHeader>
              <CardContent>
                <form action={forumThreadAction} className="space-y-4">
                  <input type="hidden" name="familyCode" value={code} />
                  <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden"><label>Website <input name="website" tabIndex={-1} autoComplete="off" /></label></div>
                  <div><Label htmlFor="authorName">Your name (or family name) *</Label><Input id="authorName" name="authorName" required minLength={2} /></div>
                  <div><Label htmlFor="title">Title *</Label><Input id="title" name="title" required minLength={5} /></div>
                  <div><Label htmlFor="body">Message *</Label><Textarea id="body" name="body" required minLength={10} /></div>
                  <Button type="submit">Submit for review</Button>
                </form>
              </CardContent>
            </Card>
            <div>
              <h2 className="mb-4 font-display text-xl font-semibold text-navy-deep">Your family&apos;s posts</h2>
              <ul className="space-y-4">
                {threads.map((t) => (
                  <li key={t.id} className="rounded-2xl border border-navy/10 bg-white p-5 shadow-card">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-navy-deep">{t.title}</h3>
                      <Badge tone={t.status === "APPROVED" ? "green" : t.status === "PENDING" ? "amber" : "red"}>{t.status.toLowerCase()}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{t.authorName} · {formatDate(t.createdAt)}</p>
                    <p className="mt-2 text-sm text-slate-700">{t.body}</p>
                  </li>
                ))}
                {threads.length === 0 && <li className="text-sm text-slate-600">You have not posted yet.</li>}
              </ul>
            </div>
          </div>
        )}
      </Section>

      <Section className="pt-0">
        <SectionTitle eyebrow="Community" title="Approved discussions" />
        <ul className="space-y-6">
          {publicThreads.map((t) => (
            <li key={t.id} className="rounded-2xl border border-navy/10 bg-white p-6 shadow-card">
              <h3 className="font-display text-xl font-semibold text-navy-deep">{t.title}</h3>
              <p className="mt-1 text-xs text-slate-500">{t.authorName} · {formatDate(t.createdAt)}{t.isLocked ? " · locked" : ""}</p>
              <p className="mt-3 text-slate-700">{t.body}</p>
              {t.replies.length > 0 && (
                <ul className="mt-4 space-y-3 border-l-2 border-sky pl-4">
                  {t.replies.map((r) => (
                    <li key={r.id} className="text-sm text-slate-700"><span className="font-semibold text-navy-deep">{r.authorName}:</span> {r.body}</li>
                  ))}
                </ul>
              )}
              {hasAccess && !t.isLocked && (
                <form action={forumReplyAction} className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <input type="hidden" name="familyCode" value={code} />
                  <input type="hidden" name="threadId" value={t.id} />
                  <Input name="authorName" aria-label="Your name" placeholder="Your name" required minLength={2} className="sm:max-w-[180px]" />
                  <Input name="body" aria-label="Reply" placeholder="Write a reply (reviewed before it appears)" required minLength={3} />
                  <Button type="submit" variant="outline" size="sm">Reply</Button>
                </form>
              )}
            </li>
          ))}
          {publicThreads.length === 0 && <li className="text-slate-600">No approved discussions yet.</li>}
        </ul>
      </Section>
    </>
  );
}
