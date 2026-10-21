import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Input, Label, Notice, Select } from "@/components/ui";
import { StatCard } from "@/components/shared/StatCard";
import { DataTable } from "@/components/shared/DataTable";
import { Logo } from "@/components/shared/Logo";
import { Users } from "lucide-react";

export const metadata = { title: "Design preview" };

const rows = [
  { id: "1", name: "Aisha Bello", cls: "JSS1 A", status: "Active" },
  { id: "2", name: "Yusuf Lawal", cls: "SS2 B", status: "Active" },
];

export default function DesignPreview() {
  return (
    <main className="mx-auto max-w-5xl space-y-8 p-8">
      <Logo />
      <h1 className="font-display text-3xl font-semibold text-navy-deep">Design system preview</h1>
      <div className="flex flex-wrap gap-3">
        <Button>Primary</Button><Button variant="sky">Sky</Button><Button variant="outline">Outline</Button><Button variant="gold">Gold</Button><Button variant="danger">Danger</Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Students" value={60} icon={Users} hint="Active" />
        <Card><CardHeader><CardTitle>Card</CardTitle></CardHeader><CardContent><Badge>Badge</Badge> <Badge tone="green">Approved</Badge></CardContent></Card>
        <div className="space-y-2"><Label htmlFor="x">Input</Label><Input id="x" placeholder="Type here" /><Select defaultValue="a"><option value="a">Option</option></Select></div>
      </div>
      <Notice>Notice banner</Notice>
      <DataTable columns={[{ key: "name", header: "Name", cell: (r) => r.name, sortValue: (r) => r.name }, { key: "cls", header: "Class", cell: (r) => r.cls }, { key: "status", header: "Status", cell: (r) => r.status }]} rows={rows} searchText={(r) => r.name} />
    </main>
  );
}
