import type { Metadata } from "next";
import { Target, Eye, HeartHandshake, Library, FlaskConical, Monitor, Trophy, Building2, Bus, BedDouble, BookOpen, Moon, ShieldCheck, Users, Trophy as Award, Utensils } from "lucide-react";
import { Moon as Crescent, Quote, BookMarked, HandHeart, Languages } from "lucide-react";
import { Section, SectionTitle } from "@/components/public/Section";
import { PlaceholderImage } from "@/components/shared/PlaceholderImage";
import { Stagger, StaggerItem } from "@/components/motion/Motion";

export const metadata: Metadata = { title: "About us", description: "History, mission, vision, values and facilities of Ansar Ruhul Islam School." };

const FACILITIES = [
  { icon: Library, label: "Library" }, { icon: FlaskConical, label: "Science laboratory" }, { icon: Monitor, label: "ICT laboratory" },
  { icon: Trophy, label: "Sports field" }, { icon: Building2, label: "Prayer hall (Musalla)" }, { icon: Utensils, label: "Halal canteen" },
  { icon: BedDouble, label: "Hostel" }, { icon: Bus, label: "School transport" },
];

export default function AboutPage() {
  return (
    <>
      <div className="lattice-navy text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky">About us</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Built on faith, knowledge and service</h1>
          {/* TODO: replace with the school's official history and founding date */}
          <p className="mt-4 max-w-2xl text-white/85">Ansar Ruhul Islam School serves families in Lagos with a Nursery, Primary and Secondary programme that balances modern learning with Islamic character.</p>
        </div>
      </div>

      <Section>
        <div className="grid gap-6 md:grid-cols-2">
          {[
            { icon: Target, title: "Our mission", body: "To provide quality, affordable education that develops knowledgeable, disciplined and God-conscious students ready for higher learning and responsible citizenship." },
            { icon: Eye, title: "Our vision", body: "To be a leading Islamic school in Nigeria, known for academic excellence, strong character and a loving community." },
          ].map((c) => (
            <div key={c.title} className="rounded-2xl border border-navy/10 bg-white p-8 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-xl">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-soft text-gold"><c.icon className="h-6 w-6" aria-hidden /></span>
              <h2 className="mt-5 font-display text-2xl font-semibold text-navy-deep">{c.title}</h2>
              <p className="mt-3 leading-relaxed text-slate-600">{c.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <SectionTitle eyebrow="Our Islamic identity" title="Faith woven into every day" description="A standard Muslim school: Qur'an, Arabic, adab and worship are part of the timetable, not an add-on." />
        <Stagger as="ul" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: BookMarked, title: "Tahfiz programme", body: "Structured Qur'an memorisation with a daily portion, tajweed correction and regular recitation.", tint: "bg-gold-soft text-gold" },
            { icon: HandHeart, title: "Adab and akhlaq", body: "Manners, honesty, respect for parents and teachers, and good conduct in class and on the road.", tint: "bg-sky-soft text-navy" },
            { icon: Crescent, title: "Salah and ibadah", body: "Daily prayer in the Musalla, Jumu'ah arrangements, and guidance on fasting and Ramadan.", tint: "bg-gold-soft text-gold" },
            { icon: Languages, title: "Arabic and Islamic Studies", body: "Arabic language, Fiqh, Aqidah and Seerah taught from the nursery classes upward.", tint: "bg-sky-soft text-navy" },
          ].map((c) => (
            <StaggerItem key={c.title} as="li">
              <div className="group h-full rounded-2xl border border-navy/10 bg-white p-6 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${c.tint}`}><c.icon className="h-5 w-5" aria-hidden /></span>
                <h3 className="mt-4 font-display text-lg font-semibold text-navy-deep">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{c.body}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
        {/* TODO: confirm the Islamic programme details with the principal before publishing */}
      </Section>

      <Section className="bg-sky-soft/50">
        <SectionTitle eyebrow="Our values" title="What we stand for" />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[["Integrity", "We do what is right, even when no one is watching."], ["Excellence", "We aim high and support every learner to reach their potential."], ["Respect", "We honour parents, teachers, elders and one another."], ["Service", "We serve our community and prepare students to serve others."]].map(([t, b]) => (
            <li key={t} className="rounded-2xl bg-white p-6 shadow-card">
              <HeartHandshake className="h-5 w-5 text-navy" aria-hidden />
              <h3 className="mt-3 font-semibold text-navy-deep">{t}</h3>
              <p className="mt-2 text-sm text-slate-600">{b}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <SectionTitle eyebrow="Leadership" title="A message from the Principal" />
            {/* TODO: replace with the principal's real message and photo */}
            <div className="mb-6 max-w-xs"><PlaceholderImage src={null} alt="Principal's portrait" label="Principal's photo" className="aspect-[4/5] w-full" /></div>
            <blockquote className="relative rounded-2xl border-l-4 border-gold bg-white p-6 text-slate-700 shadow-card">
              <Quote className="absolute right-5 top-5 h-8 w-8 text-gold/25" aria-hidden />
              &ldquo;Welcome to Ansar Ruhul Islam School. Our door is open to every parent who wishes to partner with us in raising a child who fears Allah, loves learning and serves humanity. Together we shall achieve great things.&rdquo;
              <footer className="mt-4 text-sm font-semibold text-navy-deep">— The Principal</footer>
            </blockquote>
          </div>
          <div>
            <SectionTitle eyebrow="Facilities" title="Resources for learning and growth" description="Placeholder list. Confirm each facility before publishing." />
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {FACILITIES.map((f) => (
                <li key={f.label} className="flex items-center gap-3 rounded-xl border border-navy/10 bg-white p-4 text-sm font-medium text-navy-deep transition duration-300 hover:-translate-y-0.5 hover:border-gold hover:shadow-card">
                  <f.icon className="h-5 w-5 text-navy" aria-hidden /> {f.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>
      <Section className="bg-sky-soft/50">
        <SectionTitle eyebrow="Why choose us" title="A school that grows the whole child" description="Academic excellence, moral character and wellbeing, working together every day." />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: BookOpen, title: "Strong academics", body: "A structured curriculum from JSS1 to SS3 with continuous assessment and clear, approved results." },
            { icon: Moon, title: "Faith and character", body: "Qur'an, Islamic Studies and Arabic taught daily, building discipline, honesty and respect." },
            { icon: ShieldCheck, title: "Safe and supervised", body: "Secure campus, attendance tracked every day, and parents kept informed through the portal." },
            { icon: Users, title: "Caring teachers", body: "Qualified, dedicated teachers who know every learner and mentor them personally." },
          ].map((w) => (
            <div key={w.title} className="rounded-2xl border border-navy/10 bg-white p-6 shadow-card">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-soft text-navy"><w.icon className="h-5 w-5" aria-hidden /></span>
              <h3 className="mt-4 font-display text-lg font-semibold text-navy-deep">{w.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{w.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <section className="lattice-navy text-white">
        <Section>
          <SectionTitle eyebrow="Parents say" title="Trusted by families across Lagos" center />
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { quote: "The teachers know my daughter by name and the portal keeps me updated on her results.", who: "Parent of a JSS2 student" },
              { quote: "My son memorised his juz' and improved in Mathematics in one session. We are very grateful.", who: "Parent of an SS1 student" },
              { quote: "The school is disciplined and caring. Fees are clear and payments are easy online.", who: "Parent of a JSS3 student" },
            ].map((t) => (
              <figure key={t.who} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <Award className="h-5 w-5 text-sky" aria-hidden />
                <blockquote className="mt-3 text-sm leading-relaxed text-white/90">&ldquo;{t.quote}&rdquo;</blockquote>
                {/* TODO: replace with approved parent testimonials */}
                <figcaption className="mt-4 text-xs text-sky">{t.who}</figcaption>
              </figure>
            ))}
          </div>
        </Section>
      </section>
    </>
  );
}
