import { CheckCircle2 } from "lucide-react";
import { PlaceholderImage } from "@/components/shared/PlaceholderImage";

const ITEMS = ["Qur'an and Islamic Studies rooms", "Smart classrooms", "Science laboratory", "ICT laboratory", "Library and reading room", "Musalla (prayer hall)", "Sports field", "School transport"];

/** Facilities summary with a photo slot. Confirm each item with the school before publishing. */
export function Facilities() {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2">
      <PlaceholderImage src="/images/campus/campus.jpg" alt="Students in the school courtyard surrounded by campus buildings" label="Campus photo" className="aspect-[4/3] w-full shadow-card" sizes="(min-width: 1024px) 40rem, 100vw" />
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy/70">Facilities</p>
        <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-navy-deep sm:text-4xl">Inspiring spaces for learning and worship</h2>
        <p className="mt-4 text-slate-600">Our campus gives students room to study, pray, play and explore.</p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {ITEMS.map((item) => (
            <li key={item} className="flex items-center gap-2.5 text-sm font-medium text-navy-deep">
              <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-gold" aria-hidden /> {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
