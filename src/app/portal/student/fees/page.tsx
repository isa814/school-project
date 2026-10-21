import { requireRole } from "@/lib/session";
import { db } from "@/lib/db";
import { myStudent } from "@/lib/services/student-portal";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Flash } from "@/components/shared/Flash";
import { PayForm } from "@/components/student/PayButton";
import { Card, CardContent, CardHeader, CardTitle, Badge, Notice } from "@/components/ui";
import { formatDate, formatKobo } from "@/lib/utils";
import { Wallet, Receipt, FileWarning } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, "green" | "amber" | "red"> = { PAID: "green", PARTIAL: "amber", UNPAID: "red" };

export default async function StudentFees({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  const user = await requireRole("STUDENT");
  const student = await myStudent(user.id);
  if (!student) return <Notice tone="error">Your student profile is not linked to this account.</Notice>;
  const invoices = await db.invoice.findMany({
    where: { studentId: student.id },
    include: { term: true, lines: true, payments: { orderBy: { createdAt: "desc" } } },
    orderBy: { term: { startDate: "desc" } },
  });
  const totalOwed = invoices.reduce((s, i) => s + i.totalKobo, 0);
  const totalPaid = invoices.reduce((s, i) => s + i.paidKobo, 0);
  const outstanding = totalOwed - totalPaid;

  return (
    <>
      <PageHeader eyebrow={student.admissionNo} title="Fees & receipts" description="View your invoices and pay online by card, bank transfer or USSD through Paystack. Every successful payment gets a receipt." />
      <Flash ok={searchParams.ok} err={searchParams.err} />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total billed" value={formatKobo(totalOwed)} icon={Wallet} />
        <StatCard label="Paid" value={formatKobo(totalPaid)} />
        <StatCard label="Outstanding" value={formatKobo(outstanding)} icon={FileWarning} />
      </div>

      {invoices.length === 0 && <div className="mt-6"><EmptyState title="No invoices yet" description="Invoices appear here once the bursary issues fees for your class and term." /></div>}

      <div className="mt-6 space-y-6">
        {invoices.map((inv) => {
          const due = inv.totalKobo - inv.paidKobo;
          return (
            <Card key={inv.id}>
              <CardHeader className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle>{inv.term.name} · {inv.invoiceNo}</CardTitle>
                <Badge tone={STATUS_TONE[inv.status] ?? "slate"}>{inv.status.toLowerCase()}</Badge>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Fee lines</p>
                    <ul className="mt-2 divide-y divide-navy/5 text-sm">
                      {inv.lines.map((l) => <li key={l.id} className="flex justify-between py-1.5"><span>{l.description}</span><span>{formatKobo(l.amountKobo)}</span></li>)}
                      <li className="flex justify-between py-1.5 font-semibold"><span>Total</span><span>{formatKobo(inv.totalKobo)}</span></li>
                      <li className="flex justify-between py-1.5 text-emerald-700"><span>Paid</span><span>{formatKobo(inv.paidKobo)}</span></li>
                      <li className="flex justify-between py-1.5 font-semibold text-navy-deep"><span>Balance</span><span>{formatKobo(due)}</span></li>
                    </ul>
                    <p className="mt-2 text-xs text-slate-500">Due {formatDate(inv.dueDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payments</p>
                    <ul className="mt-2 divide-y divide-navy/5 text-sm">
                      {inv.payments.map((p) => (
                        <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-1.5">
                          <span>{formatKobo(p.amountKobo)} · {p.status === "SUCCESS" ? formatDate(p.paidAt) : p.status.toLowerCase()}</span>
                          {p.status === "SUCCESS" && p.receiptNo && (
                            <a href={`/api/receipts/${p.id}`} className="focus-ring inline-flex items-center gap-1 rounded text-navy hover:underline"><Receipt className="h-3.5 w-3.5" aria-hidden /> {p.receiptNo}</a>
                          )}
                        </li>
                      ))}
                      {inv.payments.length === 0 && <li className="py-1.5 text-slate-500">No payments yet.</li>}
                    </ul>
                  </div>
                </div>
                {due > 0 && (
                  <div className="rounded-xl bg-sky-soft/60 p-4">
                    <PayForm invoiceId={inv.id} outstandingKobo={due} />
                    <p className="mt-2 text-xs text-slate-600">You can pay part of the balance now. Minimum NGN 100. Payments are confirmed automatically.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      <p className="mt-8 text-xs text-slate-500">Payments are processed by Paystack in test mode for this demo. Payments are never deleted; a payment that was made in error is reversed and kept on record.</p>
    </>
  );
}
