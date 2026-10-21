import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPermission } from "@/lib/session";
import { can } from "@/lib/permissions";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Input, Label, Select, Textarea } from "@/components/ui";
import { PageHeader } from "@/components/shared/PageHeader";
import { Flash } from "@/components/shared/Flash";
import { formatKobo, formatDate } from "@/lib/utils";
import { applyDiscountAction, recordPaymentAction, voidPaymentAction, sendFeeReminderAction } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

export default async function InvoicePage({ params, searchParams }: { params: { id: string }; searchParams: { ok?: string; err?: string } }) {
  const actor = await requireAdminPermission("fees:read");
  const invoice = await db.invoice.findUnique({
    where: { id: params.id },
    include: { student: { include: { class: true, guardians: { where: { isPrimary: true }, take: 1 } } }, term: true, lines: true, payments: { orderBy: { createdAt: "desc" } } },
  });
  if (!invoice) notFound();
  const path = `/portal/admin/fees/invoices/${invoice.id}`;
  const balance = invoice.totalKobo - invoice.paidKobo;
  const canWriteFees = can(actor, "fees:write");
  const canRecord = can(actor, "payments:record");
  const canVoid = can(actor, "payments:void");

  return (
    <>
      <PageHeader eyebrow={`${invoice.invoiceNo} · ${invoice.term.name}`} title={`${invoice.student.firstName} ${invoice.student.lastName}`} description={`${invoice.student.class.name} · ${invoice.student.admissionNo}`} actions={
        <Badge tone={invoice.status === "PAID" ? "green" : invoice.status === "PARTIAL" ? "amber" : "red"}>{invoice.status.toLowerCase()}</Badge>
      } />
      <Flash ok={searchParams.ok} err={searchParams.err} />

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle>Invoice lines</CardTitle></CardHeader>
          <CardContent>
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500"><tr><th className="py-2">Description</th><th className="text-right">Amount</th></tr></thead>
              <tbody className="divide-y divide-navy/5">
                {invoice.lines.map((l) => <tr key={l.id}><td className="py-2">{l.description}</td><td className={`text-right ${l.amountKobo < 0 ? "text-emerald-700" : ""}`}>{formatKobo(l.amountKobo)}</td></tr>)}
              </tbody>
              <tfoot className="border-t border-navy/10 text-sm font-semibold">
                <tr><td className="py-2">Total billed</td><td className="text-right">{formatKobo(invoice.totalKobo)}</td></tr>
                <tr><td className="py-2">Paid</td><td className="text-right text-emerald-700">{formatKobo(invoice.paidKobo)}</td></tr>
                <tr><td className="py-2">Balance</td><td className="text-right text-[#7a4f0c]">{formatKobo(Math.max(0, balance))}</td></tr>
              </tfoot>
            </table>
            <p className="mt-3 text-xs text-slate-500">Due {formatDate(invoice.dueDate)}</p>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {canRecord && balance > 0 && (
            <Card>
              <CardHeader><CardTitle>Record a payment</CardTitle></CardHeader>
              <CardContent>
                <form action={recordPaymentAction} className="grid gap-3">
                  <input type="hidden" name="invoiceId" value={invoice.id} />
                  <input type="hidden" name="returnTo" value={path} />
                  <div><Label htmlFor="amount">Amount (₦)</Label><Input id="amount" name="amount" type="number" min={1} max={balance / 100} step="1" required /></div>
                  <div><Label htmlFor="method">Method</Label><Select id="method" name="method" defaultValue="CASH"><option value="CASH">Cash</option><option value="POS">POS</option><option value="TRANSFER">Bank transfer</option></Select></div>
                  <Button type="submit">Record & issue receipt</Button>
                </form>
              </CardContent>
            </Card>
          )}
          {canWriteFees && balance > 0 && (
            <Card>
              <CardHeader><CardTitle>Discount or scholarship</CardTitle></CardHeader>
              <CardContent>
                <form action={applyDiscountAction} className="grid gap-3">
                  <input type="hidden" name="studentId" value={invoice.studentId} />
                  <input type="hidden" name="termId" value={invoice.termId} />
                  <input type="hidden" name="returnTo" value={path} />
                  <div><Label htmlFor="type">Type</Label><Select id="type" name="type" defaultValue="PERCENT"><option value="PERCENT">Percentage of tuition and fees</option><option value="FIXED">Fixed amount (₦)</option></Select></div>
                  <div><Label htmlFor="value">Value</Label><Input id="value" name="value" type="number" min={1} required /></div>
                  <div><Label htmlFor="reason">Reason</Label><Textarea id="reason" name="reason" required minLength={3} /></div>
                  <Button type="submit" variant="outline">Apply discount</Button>
                </form>
              </CardContent>
            </Card>
          )}
          {canWriteFees && balance > 0 && (
            <form action={sendFeeReminderAction}>
              <input type="hidden" name="invoiceId" value={invoice.id} />
              <Button type="submit" variant="outline" className="w-full">Send payment reminder</Button>
            </form>
          )}
          <Link href="/portal/admin/fees" className="focus-ring block rounded text-center text-sm font-semibold text-navy hover:underline">← Back to fees</Link>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Payments and receipts</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500"><tr><th className="py-2">Receipt</th><th>Date</th><th>Method</th><th className="text-right">Amount</th><th>Status</th><th>Action</th></tr></thead>
              <tbody className="divide-y divide-navy/5">
                {invoice.payments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 font-mono text-xs">{p.receiptNo ?? p.gatewayRef}</td>
                    <td>{formatDate(p.paidAt ?? p.createdAt)}</td>
                    <td>{p.method.toLowerCase()}</td>
                    <td className="text-right">{formatKobo(p.amountKobo)}</td>
                    <td><Badge tone={p.status === "SUCCESS" ? "green" : p.status === "VOIDED" ? "red" : "amber"}>{p.status.toLowerCase()}</Badge>{p.voidReason && <p className="mt-1 text-xs text-slate-500">{p.voidReason}</p>}</td>
                    <td className="space-y-2">
                      {p.status === "SUCCESS" && <a className="focus-ring rounded text-xs font-semibold text-navy underline" href={`/api/receipts/${p.id}`}>Receipt PDF</a>}
                      {canVoid && p.status === "SUCCESS" && (
                        <form action={voidPaymentAction} className="flex gap-2">
                          <input type="hidden" name="paymentId" value={p.id} />
                          <input type="hidden" name="returnTo" value={path} />
                          <Input name="reason" placeholder="Reason to void" required minLength={5} className="h-8 w-40 text-xs" aria-label="Reason to void" />
                          <Button type="submit" size="sm" variant="danger">Void</Button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
                {invoice.payments.length === 0 && <tr><td colSpan={6} className="py-4 text-slate-500">No payments yet.</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-500">Payments are never deleted. Voiding keeps the record with its reason.</p>
        </CardContent>
      </Card>
    </>
  );
}
