import { requireAdminPermission } from "@/lib/session";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, Notice } from "@/components/ui";
import { PageHeader } from "@/components/shared/PageHeader";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireAdminPermission("settings:write");
  const scale = await db.gradeScale.findMany({ orderBy: { minScore: "desc" } });
  return (
    <>
      <PageHeader title="Settings" description="School profile, grading and integrations." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>School profile</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-5">
            <Image src="/logo.png" alt="School logo" width={96} height={96} className="h-24 w-24 rounded-full bg-white object-contain shadow-card" />
            <div className="text-sm text-slate-700">
              <p className="font-semibold text-navy-deep">Ansar Ruhul Islam Nursery, Primary and Secondary School</p>
              <p>Motto: Knowledge is light</p>
              <p className="mt-2 text-xs text-slate-500">Logo is used on the website, portal, report cards and receipts. Replace /public/logo.png to change it.</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Grading scale</CardTitle></CardHeader>
          <CardContent>
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500"><tr><th className="py-2">Grade</th><th>Range</th><th>Remark</th></tr></thead>
              <tbody className="divide-y divide-navy/5">
                {scale.map((g) => <tr key={g.id}><td className="py-2 font-semibold">{g.grade}</td><td>{g.minScore}–{g.maxScore}</td><td>{g.remark}</td></tr>)}
              </tbody>
            </table>
          </CardContent>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle>Notifications and integrations</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <Notice tone="info">Email and SMS currently log to the server console. Connect Termii (SMS) and SendGrid or SMTP (email) through environment variables in Phase 2.</Notice>
            <p>Payments: Paystack is in test mode. Set PAYSTACK_SECRET_KEY and NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY to your test keys in the environment file.</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
