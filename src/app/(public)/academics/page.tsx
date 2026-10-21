import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Section, SectionTitle } from "@/components/public/Section";

export const metadata: Metadata = { title: "Academics", description: "Levels, subjects and assessment at Ansar Ruhul Islam School." };

export default async function AcademicsPage() {
  const [departments, classes] = await Promise.all([
    db.department.findMany({ include: { subjects: { orderBy: { name: "asc" } } }, orderBy: { name: "asc" } }),
    db.class.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true, level: true } }),
  ]);
  const junior = classes.filter((c) => c.level === "JUNIOR").map((c) => c.name);
  const senior = classes.filter((c) => c.level === "SENIOR").map((c) => c.name);

  return (
    <>
      <div className="lattice-navy text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky">Academics</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Curriculum and assessment</h1>
          <p className="mt-4 max-w-2xl text-white/85">A complete secondary curriculum with Islamic studies integrated throughout.</p>
        </div>
      </div>

      <Section>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-navy/10 bg-white p-7 shadow-card">
            <h2 className="font-display text-2xl font-semibold text-navy-deep">Junior Secondary (JSS)</h2>
            <p className="mt-2 text-slate-600">{junior.join(", ")} · Foundation years with a broad curriculum.</p>
          </div>
          <div className="rounded-2xl border border-navy/10 bg-white p-7 shadow-card">
            <h2 className="font-display text-2xl font-semibold text-navy-deep">Senior Secondary (SS)</h2>
            <p className="mt-2 text-slate-600">{senior.join(", ")} · Preparation for WAEC and NECO examinations.</p>
          </div>
        </div>
      </Section>

      <Section className="bg-sky-soft/50">
        <SectionTitle eyebrow="Subjects" title="Subjects grouped by department" description="Live from the school's academic records." />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {departments.map((d) => (
            <div key={d.id} className="rounded-2xl bg-white p-6 shadow-card">
              <h3 className="font-display text-lg font-semibold text-navy-deep">{d.name}</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {d.subjects.map((s) => <li key={s.id} className="flex justify-between"><span>{s.name}</span><span className="text-slate-400">{s.code}</span></li>)}
                {d.subjects.length === 0 && <li className="text-slate-500">No subjects yet</li>}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <SectionTitle eyebrow="Assessment" title="How we measure progress" />
        <div className="grid gap-6 md:grid-cols-3">
          {[
            ["Continuous assessment", "40 marks across tests, assignments and class work, recorded each term."],
            ["Examinations", "60 marks in end-of-term examinations, combined with CA into a total out of 100."],
            ["Grading", "The WAEC-style scale: A1 (75–100) to F9 (0–39), with remarks on every report card."],
          ].map(([t, b]) => (
            <div key={t} className="rounded-2xl border border-navy/10 bg-white p-6 shadow-card">
              <h3 className="font-semibold text-navy-deep">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{b}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
