import type { Metadata } from "next";
import { db } from "@/lib/db";
import { withDbFallback } from "@/lib/db-fallback";
import { Section, SectionTitle } from "@/components/public/Section";
import { Avatar } from "@/components/portal/Avatar";
import { Stagger, StaggerItem } from "@/components/motion/Motion";

export const metadata: Metadata = { title: "Our teachers", description: "Meet the teaching staff of Ansar Ruhul Islam School." };

/** Public directory: name, department and a short bio only. No private data is selected. */
export default async function TeachersPage() {
  const staff = await withDbFallback(db.staff.findMany({
      where: { deletedAt: null, user: { role: "TEACHER", isActive: true } },
      select: { id: true, firstName: true, lastName: true, qualification: true, bio: true, department: { select: { name: true } }, user: { select: { avatarUrl: true } } },
      orderBy: { lastName: "asc" },
      take: 48,
    }), [], "Teacher directory");
  return (
    <>
      <div className="lattice-navy text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky">Our teachers</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Dedicated educators</h1>
        </div>
      </div>
      <Section>
        <SectionTitle title="Teaching staff" description="Each teacher is committed to academic success and good character." />
        <Stagger as="ul" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {staff.map((t) => (
            <StaggerItem key={t.id} as="li">
            <div className="h-full rounded-2xl border border-navy/10 bg-white p-6 text-center shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="mx-auto flex justify-center"><Avatar name={`${t.firstName} ${t.lastName}`} src={t.user.avatarUrl} size={80} className="rounded-full" /></div>
              <h2 className="mt-4 font-display text-lg font-semibold text-navy-deep">{t.firstName} {t.lastName}</h2>
              <p className="text-sm font-medium text-navy">{t.department?.name ?? "Teaching staff"}</p>
              <p className="mt-1 text-xs text-slate-500">{t.qualification ?? ""}</p>
              <p className="mt-3 text-sm text-slate-600">{t.bio ?? "Committed to excellence in teaching and mentorship."}</p>
            </div>
            </StaggerItem>
          ))}
        </Stagger>
        {staff.length === 0 && <p className="text-slate-600">Our teaching profiles will appear here soon.</p>}
      </Section>
    </>
  );
}
