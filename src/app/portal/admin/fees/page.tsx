import Link from "next/link";
import { requireAdminPermission } from "@/lib/session";
import { can } from "@/lib/permissions";
import { db } from "@/lib/db";
import { getCurrentTerm, listClasses } from "@/lib/services/academics";
import { feeSummary } from "@/lib/services/fees";
import { generateInvoicesAction } from "@/app/actions/admin";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Label, Select } from "@/components/ui";
import { PageHeader } from "@/components/shared/PageHeader";
import { Flash } from "@/components/shared/Flash";
import { StatCard } from "@/components/shared/StatCard";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { formatKobo, formatDate } from "@/lib/utils";
import { Wallet, CircleDollarSign, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

type Row = { id: string; invoiceNo: string; name: string; cls: string; total: number; paid: number; status: string; due: Date };

export default async function FeesPage({ searchParams }: { searchParams: { ok?: string; err?: string; status?: string; classId?: string } }) {
  const actor = await requireAdminPermission("fees:read");
  const term = await getCurrentTerm();
  const classes = await listClasses();
  const summary = await feeSummary(term.id);
  const invoices = await db.invoice.findMany({
    where: {
      termId: term.id,
      ...(searchParams.status ? { status: searchParams.status as "PAID" } : {}),
      ...(searchParams.classId ? { student: { classId: searchParams.classId } } : {}),
    },
    include: { student: { include: { class: true } } },
    orderBy: { invoiceNo: "asc" },
  });
  const feeItems = await db.feeItem.findMany({ where: { termId: term.id }, include: { class: true }, orderBy: [{ class: { sortOrder: "asc" } }, { name: "asc" }] });

  const rows: Row[] = invoices.map((i) => ({
    id: i.id, invoiceNo: i.invoiceNo, name: `${i.student.firstName} ${i.student.lastName}`, cls: i.student.class.name,
    total: i.totalKobo, paid: i.paidKobo, status: i.status, due: i.dueDate,
  }));
  const columns: Column<Row>[] = [
    { key: "invoiceNo", header: "Invoice", cell: (r) => <Link href={`/portal/admin/fees/invoices/${r.id}`} className="focus-ring rounded font-mono text-xs font-semibold text-navy hover:underline">{r.invoiceNo}</Link>, sortValue: (r) => r.invoiceNo },
    { key: "name", header: "Student", cell: (r) => r.name, sortValue: (r) => r.name },
    { key: "cls", header: "Class", cell: (r) => r.cls, sortValue: (r) => r.cls },
    { key: "total", header: "Billed", cell: (r) => formatKobo(r.total), sortValue: (r) => r.total },
    { key: "paid", header: "Paid", cell: (r) => formatKobo(r.paid), sortValue: (r) => r.paid },
    { key: "balance", header: "Balance", cell: (r) => formatKobo(Math.max(0, r.total - r.paid)), sortValue: (r) => r.total - r.paid },
    { key: "status", header: "Status", cell: (r) => <Badge tone={r.status === "PAID" ? "green" : r.status === "PARTIAL" ? "amber" : "red"}>{r.status.toLowerCase()}</Badge>, sortValue: (r) => r.status },
    { key: "due", header: "Due", cell: (r) => formatDate(r.due), sortValue: (r) => r.due.getTime() },
  ];

  return (
    <>
      <PageHeader eyebrow={`${term.session.name} · ${term.name}`} title="Fees & payments" description="Fee structure, invoices, discounts and payments for the current term." actions={
        <>
          <Link href="/portal/admin/fees/outstanding" className="focus-ring inline-flex h-10 items-center rounded-xl border border-navy/20 bg-white px-4 text-sm font-semibold text-navy hover:bg-sky-soft">Outstanding balances</Link>
          <a href="/api/exports/payments" className="focus-ring inline-flex h-10 items-center rounded-xl border border-navy/20 bg-white px-4 text-sm font-semibold text-navy hover:bg-sky-soft">Export payments</a>
        </>
      } />
      <Flash ok={searchParams.ok} err={searchParams.err} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Billed" value={formatKobo(summary.billed)} icon={Wallet} hint={`${summary.count} invoices`} />
        <StatCard label="Collected" value={formatKobo(summary.collected)} icon={CircleDollarSign} hint={`${summary.paid} fully paid · ${summary.partial} partial`} />
        <StatCard label="Outstanding" value={formatKobo(summary.outstanding)} icon={AlertCircle} hint={`${summary.unpaid} unpaid`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Generate invoices</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">Creates one invoice per active student for {term.name}. Existing invoices are skipped. Discounts are applied automatically.</p>
            {can(actor, "fees:write") && (
              <form action={generateInvoicesAction} className="space-y-3">
                <input type="hidden" name="termId" value={term.id} />
                <div><Label htmlFor="gclass">Class (optional)</Label><Select id="gclass" name="classId" defaultValue=""><option value="">Whole school</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></div>
                <Button type="submit" variant="gold">Generate invoices</Button>
              </form>
            )}
          </CardContent>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle>Fee structure · {term.name}</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs uppercase text-slate-500"><tr><th className="py-2">Class</th><th>Item</th><th>Type</th><th className="text-right">Amount</th></tr></thead>
                <tbody className="divide-y divide-navy/5">
                  {feeItems.map((f) => <tr key={f.id}><td className="py-2">{f.class.name}</td><td>{f.name}</td><td>{f.type.toLowerCase()}</td><td className="text-right">{formatKobo(f.amountKobo)}</td></tr>)}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <form method="get" className="mt-8 flex flex-wrap items-end gap-3">
        <div><Label htmlFor="status">Status</Label><Select id="status" name="status" defaultValue={searchParams.status ?? ""} className="w-40"><option value="">All</option><option value="UNPAID">Unpaid</option><option value="PARTIAL">Partial</option><option value="PAID">Paid</option></Select></div>
        <div><Label htmlFor="classId2">Class</Label><Select id="classId2" name="classId" defaultValue={searchParams.classId ?? ""} className="w-40"><option value="">All</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></div>
        <Button type="submit" variant="outline">Filter</Button>
      </form>
      <div className="mt-4">
        <DataTable columns={columns} rows={rows} searchText={(r) => `${r.name} ${r.invoiceNo} ${r.cls}`} searchPlaceholder="Search invoices or students" emptyTitle="No invoices yet" emptyDescription="Generate invoices for the current term to get started." />
      </div>
    </>
  );
}
