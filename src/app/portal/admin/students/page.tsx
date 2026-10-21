import Link from "next/link";
import { UserPlus, Download } from "lucide-react";
import { requireAdminPermission } from "@/lib/session";
import { can } from "@/lib/permissions";
import { db } from "@/lib/db";
import { listStudents } from "@/lib/services/students";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge, Button, Select, Card, CardContent, Notice } from "@/components/ui";
import { Flash } from "@/components/shared/Flash";
import { promoteClassAction } from "@/app/actions/admin";
import { formatDate } from "@/lib/utils";
import type { StudentStatus } from "@prisma/client";

export const dynamic = "force-dynamic";
const STATUSES = ["ACTIVE", "GRADUATED", "TRANSFERRED", "SUSPENDED", "WITHDRAWN"] as const;

type Row = Awaited<ReturnType<typeof listStudents>>[number];

export default async function StudentsPage({ searchParams }: { searchParams: { classId?: string; status?: string; ok?: string; err?: string } }) {
  const classes = await db.class.findMany({ orderBy: { sortOrder: "asc" } });
  const status = STATUSES.find((s) => s === searchParams.status) as StudentStatus | undefined;
  const rows = await listStudents({ classId: searchParams.classId || undefined, status });
  const actor = await requireAdminPermission("students:read");
  const canWrite = can(actor, "students:write");

  const columns: Column<Row>[] = [
    { key: "admissionNo", header: "Admission No.", cell: (r) => <span className="font-mono text-xs">{r.admissionNo}</span>, sortValue: (r) => r.admissionNo },
    { key: "name", header: "Name", cell: (r) => <Link href={`/portal/admin/students/${r.id}`} className="focus-ring rounded font-semibold text-navy hover:underline">{r.firstName} {r.lastName}</Link>, sortValue: (r) => `${r.lastName} ${r.firstName}` },
    { key: "class", header: "Class", cell: (r) => `${r.class.name} ${r.section.name}`, sortValue: (r) => r.class.sortOrder },
    { key: "guardian", header: "Guardian", cell: (r) => <span className="text-slate-600">{r.guardians[0]?.name ?? "—"}</span> },
    { key: "status", header: "Status", cell: (r) => <Badge tone={r.status === "ACTIVE" ? "green" : "slate"}>{r.status.toLowerCase()}</Badge>, sortValue: (r) => r.status },
    { key: "admitted", header: "Admitted", cell: (r) => formatDate(r.admissionDate), sortValue: (r) => r.admissionDate.getTime() },
  ];

  return (
    <>
      <PageHeader title="Students" description="Search, filter and manage every student record." actions={
        <>
          <a href="/api/exports/students" className="focus-ring inline-flex h-10 items-center gap-2 rounded-xl border border-navy/20 bg-white px-4 text-sm font-semibold text-navy hover:bg-sky-soft"><Download className="h-4 w-4" aria-hidden /> Export CSV</a>
          {canWrite && <Link href="/portal/admin/students/new" className="focus-ring inline-flex h-10 items-center gap-2 rounded-xl bg-navy px-4 text-sm font-semibold text-white hover:bg-navy-deep"><UserPlus className="h-4 w-4" aria-hidden /> Add student</Link>}
        </>
      } />
      <Flash ok={searchParams.ok} err={searchParams.err} />

      <form method="get" className="mb-4 flex flex-wrap items-end gap-3">
        <div><label htmlFor="classId" className="mb-1 block text-xs font-semibold text-slate-600">Class</label><Select id="classId" name="classId" defaultValue={searchParams.classId ?? ""} className="w-44"><option value="">All classes</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></div>
        <div><label htmlFor="status" className="mb-1 block text-xs font-semibold text-slate-600">Status</label><Select id="status" name="status" defaultValue={searchParams.status ?? ""} className="w-44"><option value="">All statuses</option>{STATUSES.map((s) => <option key={s} value={s}>{s.toLowerCase()}</option>)}</Select></div>
        <Button type="submit" variant="outline" size="md">Apply filters</Button>
      </form>

      <DataTable columns={columns} rows={rows} searchText={(r) => `${r.firstName} ${r.lastName} ${r.admissionNo} ${r.class.name}`} searchPlaceholder="Search by name, admission number or class" emptyTitle="No students match" emptyDescription="Try another class or status, or add a new student." />

      <Card className="mt-8">
        <CardContent className="pt-6">
          <h2 className="font-display text-lg font-semibold text-navy-deep">Promote a class</h2>
          <p className="mt-1 text-sm text-slate-600">Moves every active student from one class to another, keeping their section letter where possible.</p>
          <form action={promoteClassAction} className="mt-4 flex flex-wrap items-end gap-3">
            <div><label htmlFor="fromClassId" className="mb-1 block text-xs font-semibold text-slate-600">From</label><Select id="fromClassId" name="fromClassId" required className="w-40" defaultValue="">
              <option value="" disabled>Choose</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></div>
            <div><label htmlFor="toClassId" className="mb-1 block text-xs font-semibold text-slate-600">To</label><Select id="toClassId" name="toClassId" required className="w-40" defaultValue="">
              <option value="" disabled>Choose</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></div>
            <Button type="submit" variant="gold">Promote students</Button>
          </form>
          <div className="mt-4"><Notice tone="info">Promotion is applied to all active students in the source class. Review the list first.</Notice></div>
        </CardContent>
      </Card>
    </>
  );
}
