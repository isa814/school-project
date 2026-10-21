import Link from "next/link";
import { Users, UserRound, School, BookOpen, Wallet, Megaphone, ClipboardCheck, MessagesSquare, FileCheck2, UserPlus, Receipt } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { can } from "@/lib/permissions";
import { StatCard } from "@/components/shared/StatCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";
import { StatusDonut, MoneyBars } from "@/components/charts/Charts";
import { getCurrentTerm } from "@/lib/services/academics";
import { feeSummary } from "@/lib/services/fees";
import { formatDate, formatKobo } from "@/lib/utils";
import { Flash } from "@/components/shared/Flash";
import { changePasswordAction } from "@/app/actions/student";

export const dynamic = "force-dynamic";

export default async function AdminDashboard({ searchParams }: { searchParams: { ok?: string; err?: string; denied?: string } }) {
  const user = await getCurrentUser();
  if (!user) return null;
  const term = await getCurrentTerm();
  const today = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);
  const [students, teachers, classes, subjects, todayAtt, fees, events, activity, announcements, pendingSheets, pendingForum, pendingApps, messages] = await Promise.all([
    db.student.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    db.staff.count({ where: { deletedAt: null, user: { role: "TEACHER" } } }),
    db.class.count(),
    db.subject.count(),
    db.attendance.groupBy({ by: ["status"], where: { date: today }, _count: { _all: true } }),
    feeSummary(term.id),
    db.event.findMany({ where: { date: { gte: new Date() } }, orderBy: { date: "asc" }, take: 4 }),
    db.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { user: { select: { email: true } } } }),
    db.announcement.findMany({ orderBy: { publishedAt: "desc" }, take: 4 }),
    db.score.count({ where: { status: "SUBMITTED" } }),
    db.forumThread.count({ where: { status: "PENDING" } }),
    db.admissionApplication.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }),
    db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 4 }),
  ]);

  const attData = todayAtt.map((r) => ({ name: r.status.toLowerCase(), value: r._count._all }));
  const feeData = [{ name: term.name, collected: fees.collected / 100, outstanding: fees.outstanding / 100 }];

  return (
    <>
      <PageHeader eyebrow={`${term.session.name} · ${term.name}`} title={`Welcome, ${user.name.split(" ")[0]}`} description="Here is what needs attention today." actions={
        can(user, "students:write") ? (
          <Link href="/portal/admin/students/new" className="focus-ring inline-flex h-10 items-center gap-2 rounded-xl bg-navy px-4 text-sm font-semibold text-white hover:bg-navy-deep"><UserPlus className="h-4 w-4" aria-hidden /> Add student</Link>
        ) : undefined
      } />
      <Flash ok={searchParams.ok} err={searchParams.err ?? (searchParams.denied ? "That page is not available to your role." : undefined)} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active students" value={students} icon={Users} />
        <StatCard label="Teachers" value={teachers} icon={UserRound} />
        <StatCard label="Classes" value={classes} icon={School} hint="JSS1 to SS3, arms A and B" />
        <StatCard label="Subjects" value={subjects} icon={BookOpen} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader><CardTitle>Today&apos;s attendance</CardTitle></CardHeader>
          <CardContent><StatusDonut data={attData} /></CardContent>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle>Fee collection · {term.name}</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-4 grid grid-cols-3 gap-3 text-sm">
              <div><p className="text-slate-500">Billed</p><p className="font-semibold">{formatKobo(fees.billed)}</p></div>
              <div><p className="text-slate-500">Collected</p><p className="font-semibold text-emerald-700">{formatKobo(fees.collected)}</p></div>
              <div><p className="text-slate-500">Outstanding</p><p className="font-semibold text-[#7a4f0c]">{formatKobo(fees.outstanding)}</p></div>
            </div>
            <MoneyBars data={feeData} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Needs your attention</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Link href="/portal/admin/results" className="flex items-center justify-between rounded-xl bg-sky-soft/60 px-4 py-3 hover:bg-sky-soft"><span className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4" aria-hidden /> Score sheets to approve</span><Badge>{pendingSheets}</Badge></Link>
            <Link href="/portal/admin/admissions" className="flex items-center justify-between rounded-xl bg-sky-soft/60 px-4 py-3 hover:bg-sky-soft"><span className="flex items-center gap-2"><FileCheck2 className="h-4 w-4" aria-hidden /> Open applications</span><Badge>{pendingApps}</Badge></Link>
            <Link href="/portal/admin/forum" className="flex items-center justify-between rounded-xl bg-sky-soft/60 px-4 py-3 hover:bg-sky-soft"><span className="flex items-center gap-2"><MessagesSquare className="h-4 w-4" aria-hidden /> Forum posts awaiting review</span><Badge>{pendingForum}</Badge></Link>
            <Link href="/portal/admin/fees/outstanding" className="flex items-center justify-between rounded-xl bg-sky-soft/60 px-4 py-3 hover:bg-sky-soft"><span className="flex items-center gap-2"><Wallet className="h-4 w-4" aria-hidden /> Invoices with balances</span><Badge tone="amber">{fees.partial + fees.unpaid}</Badge></Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Upcoming events</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {events.map((e) => <li key={e.id} className="flex justify-between gap-3"><span className="font-medium text-navy-deep">{e.title}</span><span className="text-slate-500">{formatDate(e.date)}</span></li>)}
              {events.length === 0 && <li className="text-slate-500">No upcoming events.</li>}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Latest announcements</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {announcements.map((a) => <li key={a.id}><p className="font-medium text-navy-deep">{a.title}</p><p className="text-xs text-slate-500">{formatDate(a.publishedAt)} · {a.audience.toLowerCase()}</p></li>)}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Recent activity</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y divide-navy/5 text-sm">
              {activity.map((a) => (
                <li key={a.id} className="flex justify-between gap-3 py-2">
                  <span><span className="font-medium text-navy-deep">{a.action.replace(/_/g, " ").toLowerCase()}</span> <span className="text-slate-500">{a.user?.email ?? "system"}</span></span>
                  <span className="shrink-0 text-xs text-slate-500">{a.createdAt.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}</span>
                </li>
              ))}
              {activity.length === 0 && <li className="py-2 text-slate-500">No activity yet.</li>}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Website enquiries</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {messages.map((m) => <li key={m.id}><p className="font-medium text-navy-deep">{m.subject}</p><p className="text-slate-600">{m.name} · {m.email}</p><p className="line-clamp-2 text-slate-600">{m.message}</p></li>)}
              {messages.length === 0 && <li className="text-slate-500">No messages yet.</li>}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link href="/portal/admin/fees" className="focus-ring inline-flex items-center gap-2 rounded-xl border border-navy/20 bg-white px-4 py-2.5 font-medium text-navy hover:bg-sky-soft"><Receipt className="h-4 w-4" aria-hidden /> Fees & invoices</Link>
        <Link href="/portal/admin/announcements" className="focus-ring inline-flex items-center gap-2 rounded-xl border border-navy/20 bg-white px-4 py-2.5 font-medium text-navy hover:bg-sky-soft"><Megaphone className="h-4 w-4" aria-hidden /> Post announcement</Link>
        <Link href="/portal/admin/reports" className="focus-ring inline-flex items-center gap-2 rounded-xl border border-navy/20 bg-white px-4 py-2.5 font-medium text-navy hover:bg-sky-soft">Reports & exports</Link>
      </div>

      <Card className="mt-8">
        <CardHeader><CardTitle>Change your password</CardTitle></CardHeader>
        <CardContent>
          <form action={changePasswordAction} className="grid max-w-xl gap-3 sm:grid-cols-3">
            <input name="current" type="password" required placeholder="Current password" className="focus-ring rounded-xl border border-navy/20 px-3 py-2 text-sm" />
            <input name="next" type="password" required minLength={8} placeholder="New password" className="focus-ring rounded-xl border border-navy/20 px-3 py-2 text-sm" />
            <input name="confirm" type="password" required minLength={8} placeholder="Confirm" className="focus-ring rounded-xl border border-navy/20 px-3 py-2 text-sm" />
            <button type="submit" className="focus-ring h-10 rounded-xl bg-navy px-4 text-sm font-semibold text-white sm:col-span-3 sm:w-fit">Update password</button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
