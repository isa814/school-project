import { requireAdminPermission } from "@/lib/session";
import { can } from "@/lib/permissions";
import { db } from "@/lib/db";
import { getCurrentTerm } from "@/lib/services/academics";
import { sendFeeReminderAction } from "@/app/actions/admin";
import { Badge, Button } from "@/components/ui";
import { PageHeader } from "@/components/shared/PageHeader";
import { Flash } from "@/components/shared/Flash";
import { formatKobo } from "@/lib/utils";
import { DataTable, type Column } from "@/components/shared/DataTable";

export const dynamic = "force-dynamic";
type Row = { id: string; name: string; cls: string; balance: number; status: string; guardian: string; phone: string; invoiceNo: string };

export default async function OutstandingPage({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  const actor = await requireAdminPermission("fees:read");
  const term = await getCurrentTerm();
  const invoices = await db.invoice.findMany({
    where: { termId: term.id, status: { not: "PAID" } },
    include: { student: { include: { class: true, guardians: { where: { isPrimary: true }, take: 1 } } } },
  });
  const rows: Row[] = invoices.map((i) => ({
    id: i.id, name: `${i.student.firstName} ${i.student.lastName}`, cls: i.student.class.name, balance: i.totalKobo - i.paidKobo,
    status: i.status, guardian: i.student.guardians[0]?.name ?? "—", phone: i.student.guardians[0]?.phone ?? "—", invoiceNo: i.invoiceNo,
  })).sort((a, b) => b.balance - a.balance);
  const total = rows.reduce((s, r) => s + r.balance, 0);
  const canRemind = can(actor, "fees:write");

  const columns: Column<Row>[] = [
    { key: "name", header: "Student", cell: (r) => <span className="font-semibold text-navy-deep">{r.name}</span>, sortValue: (r) => r.name },
    { key: "cls", header: "Class", cell: (r) => r.cls, sortValue: (r) => r.cls },
    { key: "balance", header: "Balance", cell: (r) => formatKobo(r.balance), sortValue: (r) => r.balance },
    { key: "status", header: "Status", cell: (r) => <Badge tone={r.status === "PARTIAL" ? "amber" : "red"}>{r.status.toLowerCase()}</Badge> },
    { key: "guardian", header: "Guardian", cell: (r) => <span className="text-slate-600">{r.guardian} · {r.phone}</span> },
    { key: "action", header: "", cell: (r) => canRemind ? (
      <form action={sendFeeReminderAction}><input type="hidden" name="invoiceId" value={r.id} /><Button type="submit" size="sm" variant="outline">Send reminder</Button></form>
    ) : null },
  ];

  return (
    <>
      <PageHeader eyebrow={term.name} title="Outstanding balances" description={`${rows.length} invoices with a balance, totalling ${formatKobo(total)}.`} actions={
        <a href="/api/exports/outstanding-fees" className="focus-ring inline-flex h-10 items-center rounded-xl border border-navy/20 bg-white px-4 text-sm font-semibold text-navy hover:bg-sky-soft">Export CSV</a>
      } />
      <Flash ok={searchParams.ok} err={searchParams.err} />
      <DataTable columns={columns} rows={rows} searchText={(r) => `${r.name} ${r.cls} ${r.invoiceNo}`} searchPlaceholder="Search outstanding invoices" emptyTitle="No outstanding balances" emptyDescription="Every invoice for this term is paid." />
    </>
  );
}
