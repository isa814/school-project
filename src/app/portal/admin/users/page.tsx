import { requireAdminPermission } from "@/lib/session";
import { db } from "@/lib/db";
import { createAdminAccountAction, resetUserPasswordAction, toggleUserActiveAction, setAdminRoleAction } from "@/app/actions/admin";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Input, Label, Select } from "@/components/ui";
import { PageHeader } from "@/components/shared/PageHeader";
import { Flash } from "@/components/shared/Flash";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
const ADMIN_ROLES = ["SUPER_ADMIN", "PRINCIPAL", "VICE_PRINCIPAL", "ACCOUNTANT", "LIBRARIAN", "NURSE", "TRANSPORT_MANAGER"] as const;

export default async function UsersPage({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  const actor = await requireAdminPermission("users:manage");
  const isSuper = actor.adminRole === "SUPER_ADMIN";
  const [users, logs] = await Promise.all([
    db.user.findMany({ where: { role: "ADMIN" }, orderBy: { email: "asc" } }),
    db.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 40, include: { user: { select: { email: true } } } }),
  ]);

  return (
    <>
      <PageHeader title="Users & security" description="Admin accounts, sub-roles, password resets and the audit trail." />
      <Flash ok={searchParams.ok} err={searchParams.err} />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader><CardTitle>Admin accounts</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y divide-navy/5">
              {users.map((u) => (
                <li key={u.id} className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-navy-deep">{u.email}</p>
                    <p className="text-xs text-slate-500">Last sign-in {formatDate(u.lastLoginAt)}</p>
                    <div className="mt-1 flex gap-2"><Badge tone="navy">{u.adminRole?.replace("_", " ").toLowerCase()}</Badge>{!u.isActive && <Badge tone="red">inactive</Badge>}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <form action={resetUserPasswordAction}><input type="hidden" name="userId" value={u.id} /><Button type="submit" size="sm" variant="outline">Reset password</Button></form>
                    {u.id !== actor.id && <form action={toggleUserActiveAction}><input type="hidden" name="userId" value={u.id} /><Button type="submit" size="sm" variant="outline">{u.isActive ? "Deactivate" : "Activate"}</Button></form>}
                    {isSuper && u.id !== actor.id && (
                      <form action={setAdminRoleAction} className="flex gap-2">
                        <input type="hidden" name="userId" value={u.id} />
                        <Select name="adminRole" defaultValue={u.adminRole ?? "PRINCIPAL"} className="h-9 w-40 text-xs" aria-label="Admin role">{ADMIN_ROLES.map((r) => <option key={r} value={r}>{r.replace("_", " ").toLowerCase()}</option>)}</Select>
                        <Button type="submit" size="sm" variant="ghost">Set role</Button>
                      </form>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {isSuper && (
          <Card>
            <CardHeader><CardTitle>Create admin account</CardTitle></CardHeader>
            <CardContent>
              <form action={createAdminAccountAction} className="grid gap-4">
                <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required /></div>
                <div><Label htmlFor="adminRole">Role</Label><Select id="adminRole" name="adminRole" defaultValue="PRINCIPAL">{ADMIN_ROLES.map((r) => <option key={r} value={r}>{r.replace("_", " ").toLowerCase()}</option>)}</Select></div>
                <Button type="submit">Create account</Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Activity log</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500"><tr><th className="py-2">When</th><th>User</th><th>Action</th><th>Entity</th></tr></thead>
              <tbody className="divide-y divide-navy/5">
                {logs.map((l) => (
                  <tr key={l.id}><td className="py-2 whitespace-nowrap text-xs text-slate-500">{l.createdAt.toLocaleString("en-NG")}</td><td>{l.user?.email ?? "system"}</td><td className="font-mono text-xs">{l.action}</td><td className="text-slate-600">{l.entity ?? "—"}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
