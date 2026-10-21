import Link from "next/link";
import { existsSync } from "node:fs";
import path from "node:path";
import Image from "next/image";
import type { Metadata } from "next";
import { GraduationCap, BookOpen, Info, Users, Newspaper, ImageIcon, MessagesSquare, Phone, Star, ArrowRight, MoonStar } from "lucide-react";
import { db } from "@/lib/db";
import { withDbFallback } from "@/lib/db-fallback";
import { buttonVariants } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Section, SectionTitle, StarDivider } from "@/components/public/Section";
import { PrayerTimes } from "@/components/shared/PrayerTimes";
import { DailyVerse } from "@/components/shared/DailyVerse";
import { CountUp, Float, Stagger, StaggerItem, PageTransition } from "@/components/motion/Motion";
import { StudentLife } from "@/components/public/home/StudentLife";
import { SchoolVideo } from "@/components/public/home/SchoolVideo";
import { FaqAccordion, type FaqItem } from "@/components/public/home/FaqAccordion";
import { Facilities } from "@/components/public/home/Facilities";
import { SectionTitle as Title } from "@/components/public/Section";

/** Drop a clip at public/videos/school-life.mp4 to show it on the home page. */
const SCHOOL_VIDEO_PATH = path.join(process.cwd(), "public", "videos", "school-life.mp4");
type HomeStats = { studentCount: number; teacherCount: number; passRate: number; sample: boolean };

// TODO: confirm each answer with the school office before publishing.
const FAQS: FaqItem[] = [
  { q: "How do I apply?", a: "Complete the online application form on the Admissions page. You will receive an application reference to track your status." },
  { q: "Which classes do you admit?", a: "We admit pupils to the Nursery and Primary levels, and students to Junior and Senior Secondary (JSS1 to SS3)." },
  { q: "Do students learn the Qur'an and Arabic?", a: "Yes. Qur'an, Arabic and Islamic Studies are taught every week, alongside the national curriculum." },
  { q: "How are school fees paid?", a: "Parents pay online through the school portal by card. Every payment is confirmed with a receipt that can be downloaded." },
  { q: "Is there a prayer space?", a: "Yes. The Musalla is used for daily Dhuhr prayer and Jumu'ah arrangements, and students are guided in salah and ibadah." },
  { q: "How do parents follow their child's progress?", a: "Parents can view results, attendance and announcements. Families without a portal account can use Guardian View with the PIN issued by the school." },
];

export const metadata: Metadata = {
  title: "Home",
  description: "Ansar Ruhul Islam Nursery, Primary and Secondary School in Lagos. Admissions for JSS1 to SS3 are open.",
};
// Avoid connecting to the school database while Next.js pre-renders the site.
// Runtime rendering keeps production builds independent from database uptime.
export const revalidate = 300;

/** Each card opens its own page. The home page only summarises. */
const PAGES = [
  { href: "/about", icon: Info, title: "About us", body: "Our mission, values, leadership and the faith-based character of the school.", tint: "bg-sky-soft text-navy" },
  { href: "/academics", icon: BookOpen, title: "Academics", body: "The curriculum from JSS1 to SS3, subjects by department and how we assess progress.", tint: "bg-gold-soft text-gold" },
  { href: "/teachers", icon: Users, title: "Teachers", body: "Meet the dedicated educators who know every learner and mentor them personally.", tint: "bg-sky-soft text-navy" },
  { href: "/admissions", icon: GraduationCap, title: "Admissions", body: "How to apply, the requirements, important dates and how to track your application.", tint: "bg-gold-soft text-gold" },
  { href: "/news", icon: Newspaper, title: "News & events", body: "Latest school news, the academic calendar and upcoming events.", tint: "bg-sky-soft text-navy" },
  { href: "/gallery", icon: ImageIcon, title: "Gallery", body: "Life at Ansar Ruhul Islam School, in classrooms, on the field and at prayer.", tint: "bg-gold-soft text-gold" },
  { href: "/forum", icon: MessagesSquare, title: "Parent forum", body: "Questions and discussion for parents, moderated by the school.", tint: "bg-sky-soft text-navy" },
  { href: "/contact", icon: Phone, title: "Contact", body: "Reach the school office by phone, email or a message through this form.", tint: "bg-gold-soft text-gold" },
];

export default async function HomePage() {
  const hasVideo = existsSync(SCHOOL_VIDEO_PATH);
  // One database round trip avoids loading every score just to calculate a percentage.
  const stats = await withDbFallback<HomeStats>(
    db.$queryRaw<HomeStats[]>`
      SELECT
        (SELECT COUNT(*)::int FROM "Student" WHERE "deletedAt" IS NULL AND "status" = 'ACTIVE') AS "studentCount",
        (SELECT COUNT(*)::int FROM "Staff" AS staff JOIN "User" AS account ON account."id" = staff."userId" WHERE staff."deletedAt" IS NULL AND account."role" = 'TEACHER') AS "teacherCount",
        COALESCE((SELECT ROUND(100.0 * COUNT(*) FILTER (WHERE "grade" IS NOT NULL AND "grade" <> 'F9') / NULLIF(COUNT(*), 0))::int FROM "Score" WHERE "status" IN ('APPROVED', 'LOCKED')), 0) AS "passRate",
        FALSE AS "sample"
    `.then((rows) => rows[0] ?? { studentCount: 0, teacherCount: 0, passRate: 0, sample: false }),
    { studentCount: 320, teacherCount: 25, passRate: 94, sample: true },
    "Home statistics",
    750,
  );
  const { studentCount, teacherCount, passRate } = stats;

  return (
    <PageTransition>
      {/* Hero */}
      <section className="lattice-navy relative overflow-hidden text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-gold/20 blur-3xl" aria-hidden />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div>
            <p lang="ar" dir="rtl" className="font-display text-2xl text-gold sm:text-3xl">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
            <p className="mt-2 text-sm text-white/70">In the name of Allah, the Most Gracious, the Most Merciful</p>
            <p className="mt-8 inline-flex items-center gap-2 rounded-full border border-sky/40 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky">
              <Star className="h-3.5 w-3.5" aria-hidden /> Admissions open for 2026/2027
            </p>
            <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Knowledge is light. <span className="text-sky">Raise a child who shines.</span>
            </h1>
            {/* TODO: replace with the principal's approved school tagline */}
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/85">
              Ansar Ruhul Islam Nursery, Primary and Secondary School combines rigorous academics with Islamic values, from the nursery to Senior Secondary.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/admissions/apply" className={cn(buttonVariants({ variant: "gold", size: "lg" }))}>Apply for Admission</Link>
              <Link href="/about" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "border-white/30 bg-transparent text-white hover:bg-white/10")}>Discover the school</Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-6 rounded-[2rem] bg-sky/15 blur-2xl" aria-hidden />
            <Float amount={6}>
              <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white shadow-2xl">
                <Image
                  src="/images/hero-student.jpg"
                  alt="A smiling Muslim student in school uniform and kufi cap, holding an open Qur'an in a school courtyard"
                  width={1408}
                  height={768}
                  priority
                  sizes="(min-width: 1024px) 36rem, 100vw"
                  className="h-auto w-full object-cover"
                />
              </div>
            </Float>
            <div className="absolute -bottom-6 left-4 right-4 grid grid-cols-3 gap-3 rounded-2xl bg-white p-4 pb-3 text-center shadow-xl sm:left-8 sm:right-8">
              <div><p className="font-display text-2xl font-semibold text-navy-deep"><CountUp value={studentCount} suffix="+" /></p><p className="text-xs text-slate-600">Active students</p></div>
              <div><p className="font-display text-2xl font-semibold text-navy-deep"><CountUp value={teacherCount} /></p><p className="text-xs text-slate-600">Teachers</p></div>
              <div><p className="font-display text-2xl font-semibold text-navy-deep"><CountUp value={passRate} suffix="%" /></p><p className="text-xs text-slate-600">Pass rate</p></div>
              <p className="col-span-3 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500">{stats.sample ? "Sample figures" : "Live school figures"}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Facilities */}
      <Section className="pt-24">
        <Facilities />
      </Section>

      {/* Student life */}
      <section className="bg-sky-soft/50">
        <Section>
          <Title eyebrow="Student life" title="Experience vibrant school life" description="Beyond the classroom: sports, competitions, trips and celebrations that build confidence, teamwork and faith." center />
          <StudentLife />
        </Section>
      </section>

      {/* School video */}
      <Section>
        <Title eyebrow="Our school" title="See the school in motion" description="A short look at everyday life on campus." center />
        <div className="mx-auto max-w-5xl">
          <SchoolVideo hasVideo={hasVideo} />
        </div>
      </Section>

      {/* Prayer times and daily word */}
      <Section className="pt-28">
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3"><PrayerTimes /></div>
          <div className="rounded-3xl bg-navy-deep p-8 lg:col-span-2">
            <DailyVerse />
            <p className="mt-6 flex items-center gap-2 text-xs text-white/60"><MoonStar className="h-3.5 w-3.5" aria-hidden /> Prayer space and Jumu&apos;ah arrangements are shared with families each term.</p>
          </div>
        </div>
      </Section>

      {/* Page cards */}
      <Section className="pt-0">
        <SectionTitle eyebrow="Explore" title="Find out more about the school" description="Each section has its own page with the details you need." />
        <Stagger as="ul" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PAGES.map((p) => (
            <StaggerItem key={p.href} as="li">
              <Link href={p.href} className="focus-ring group flex h-full flex-col rounded-2xl border border-navy/10 bg-white p-6 shadow-card transition duration-300 hover:-translate-y-1 hover:border-sky hover:shadow-xl">
                <span className={cn("flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110", p.tint)}><p.icon className="h-5 w-5" aria-hidden /></span>
                <h3 className="mt-4 font-display text-lg font-semibold text-navy-deep">{p.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{p.body}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-navy group-hover:underline">Open page <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden /></span>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      {/* FAQ */}
      <section className="bg-surface-muted">
        <Section>
          <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr]">
            <div>
              <Title eyebrow="FAQ" title="Frequently asked questions" description="Quick answers about admissions, the curriculum, fees and life at school." />
              <Link href="/contact" className="text-sm font-semibold text-navy underline-offset-4 hover:underline">Still have a question? Contact the school office</Link>
            </div>
            <FaqAccordion items={FAQS} />
          </div>
        </Section>
      </section>

      {/* Final CTA */}
      <Section className="text-center">
        <StarDivider />
        <h2 className="mt-6 font-display text-3xl font-semibold text-navy-deep sm:text-4xl">Give your child a bright start</h2>
        <p className="mx-auto mt-4 max-w-xl text-slate-600">Apply online in a few minutes. You will receive an application reference to track your status.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/admissions/apply" className={cn(buttonVariants({ variant: "gold", size: "lg" }))}><GraduationCap className="h-5 w-5" aria-hidden /> Apply for Admission</Link>
          <Link href="/contact" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>Talk to us</Link>
        </div>
      </Section>
    </PageTransition>
  );
}
