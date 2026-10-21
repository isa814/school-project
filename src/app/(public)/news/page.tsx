import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { withDbFallback } from "@/lib/db-fallback";
import { Section, SectionTitle } from "@/components/public/Section";
import { formatDate } from "@/lib/utils";
import { PlaceholderImage } from "@/components/shared/PlaceholderImage";
import { Stagger, StaggerItem } from "@/components/motion/Motion";

export const metadata: Metadata = { title: "News & events", description: "Latest news and upcoming events from Ansar Ruhul Islam School." };

const FEATURE_IMAGES = [
  "/images/student-life/quiz.jpg",
  "/images/student-life/science.jpg",
  "/images/student-life/sports-day.jpg",
  "/images/student-life/eid.jpg",
];

export default async function NewsPage() {
  const { news, events } = await withDbFallback(
    Promise.all([
      db.newsPost.findMany({ where: { publishedAt: { not: null } }, orderBy: { publishedAt: "desc" }, take: 12 }),
      db.event.findMany({ orderBy: { date: "asc" }, take: 12 }),
    ]).then(([news, events]) => ({ news, events })),
    { news: [], events: [] },
    "News and events",
  );
  return (
    <>
      <div className="lattice-navy text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky">News & events</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">What is happening at school</h1>
        </div>
      </div>
      <Section>
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <SectionTitle eyebrow="News" title="Stories and updates" />
            <Stagger as="ul" className="grid gap-6 sm:grid-cols-2">
              {news.map((n, index) => (
                <StaggerItem key={n.id} as="li">
                <Link href={`/news/${n.slug}`} className="focus-ring group block h-full rounded-2xl border border-navy/10 bg-white p-6 shadow-card transition duration-300 hover:-translate-y-1 hover:border-sky hover:shadow-xl">
                  <PlaceholderImage src={n.coverImage ?? FEATURE_IMAGES[index % FEATURE_IMAGES.length]} alt={n.title} label="School life" className="mb-4 aspect-[16/9] w-full" sizes="(min-width: 640px) 24rem, 100vw" />
                  <p className="text-xs text-slate-500">{formatDate(n.publishedAt)}</p>
                  <h2 className="mt-2 font-display text-xl font-semibold text-navy-deep group-hover:text-navy">{n.title}</h2>
                  <p className="mt-2 text-sm text-slate-600">{n.excerpt}</p>
                  <span className="mt-4 inline-block text-sm font-semibold text-navy transition-transform duration-300 group-hover:translate-x-1">Read more →</span>
                </Link>
                </StaggerItem>
              ))}
              {news.length === 0 && <li className="rounded-2xl border border-navy/10 bg-white p-6 text-sm text-slate-600 sm:col-span-2">No published news yet. Please check back soon.</li>}
            </Stagger>
          </div>
          <div>
            <SectionTitle eyebrow="Calendar" title="Events" />
            <ul className="space-y-4">
              {events.map((e, index) => (
                <li key={e.id} className="rounded-2xl border border-navy/10 bg-white p-5 shadow-card">
                  <PlaceholderImage src={FEATURE_IMAGES[(index + 1) % FEATURE_IMAGES.length]} alt={`${e.title} event`} label="School event" className="mb-4 aspect-[16/7] w-full" sizes="(min-width: 1024px) 28rem, 100vw" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-navy/70">{formatDate(e.date)} · {e.type.toLowerCase()}</p>
                  <h3 className="mt-1 font-semibold text-navy-deep">{e.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{e.description}</p>
                </li>
              ))}
              {events.length === 0 && <li className="rounded-2xl border border-navy/10 bg-white p-5 text-sm text-slate-600">No upcoming events have been posted yet.</li>}
            </ul>
          </div>
        </div>
      </Section>
    </>
  );
}
