import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { can, type Permission } from "@/lib/permissions";

type Exporter = { permission: Permission; run: () => Promise<{ headers: string[]; rows: (string | number)[][] }> };

const EXPORTERS: Record<string, Exporter> = {
  students: {
    permission: "students:read",
    run: async () => {
      const students = await db.student.findMany({ where: { deletedAt: null }, include: { class: true, section: true }, orderBy: { admissionNo: "asc" } });
      return {
        headers: ["Admission No", "First Name", "Last Name", "Gender", "Class", "Section", "Status"],
        rows: students.map((s) => [s.admissionNo, s.firstName, s.lastName, s.gender, s.class.name, s.section.name, s.status]),
      };
    },
  },
  "outstanding-fees": {
    permission: "fees:read",
    run: async () => {
      const invoices = await db.invoice.findMany({ where: { status: { not: "PAID" } }, include: { student: { include: { class: true } }, term: true }, orderBy: { invoiceNo: "asc" } });
      return {
        headers: ["Invoice No", "Admission No", "Student", "Class", "Term", "Total (NGN)", "Paid (NGN)", "Balance (NGN)", "Status"],
        rows: invoices.map((i) => [i.invoiceNo, i.student.admissionNo, `${i.student.firstName} ${i.student.lastName}`, i.student.class.name, i.term.name, i.totalKobo / 100, i.paidKobo / 100, (i.totalKobo - i.paidKobo) / 100, i.status]),
      };
    },
  },
  payments: {
    permission: "reports:finance",
    run: async () => {
      const payments = await db.payment.findMany({ include: { invoice: { include: { student: true } } }, orderBy: { createdAt: "desc" } });
      return {
        headers: ["Receipt No", "Reference", "Date", "Student", "Invoice", "Method", "Amount (NGN)", "Status"],
        rows: payments.map((p) => [p.receiptNo ?? "", p.gatewayRef, (p.paidAt ?? p.createdAt).toISOString().slice(0, 10), `${p.invoice.student.firstName} ${p.invoice.student.lastName}`, p.invoice.invoiceNo, p.method, p.amountKobo / 100, p.status]),
      };
    },
  },
};

function csvCell(v: string | number): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(_req: Request, { params }: { params: { kind: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const exporter = EXPORTERS[params.kind];
  if (!exporter) return NextResponse.json({ error: "unknown export" }, { status: 404 });
  if (!can(user, exporter.permission)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { headers, rows } = await exporter.run();
  const csv = [headers, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${params.kind}.csv"` } });
}
