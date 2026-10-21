"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight, Trophy, Brain, Bus, Medal, PartyPopper, MoonStar, BookOpen, FlaskConical, type LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { PlaceholderImage } from "@/components/shared/PlaceholderImage";
import { buttonVariants } from "@/components/ui";
import { cn } from "@/lib/utils";

const ACTIVITIES: { icon: LucideIcon; title: string; body: string; tint: string; image: string }[] = [
  { icon: Trophy, title: "Inter-house sports", image: "/images/student-life/sports-day.jpg", body: "Athletics, football and netball between houses, with a closing march past.", tint: "bg-gold-soft text-gold" },
  { icon: Medal, title: "Interschool sports", image: "/images/student-life/interschool-sports.jpg", body: "Our teams compete with schools across Lagos in football, basketball and athletics.", tint: "bg-sky-soft text-navy" },
  { icon: Brain, title: "Quiz competitions", image: "/images/student-life/quiz.jpg", body: "General knowledge, Islamic Studies and Mathematics quizzes for every level.", tint: "bg-gold-soft text-gold" },
  { icon: Bus, title: "Tours and excursions", image: "/images/student-life/tour.webp", body: "Educational trips to museums, farms, industries and places of historical interest.", tint: "bg-sky-soft text-navy" },
  { icon: PartyPopper, title: "End-of-year party", image: "/images/student-life/party.jpg", body: "A celebration of the year's achievements with games, music and awards.", tint: "bg-gold-soft text-gold" },
  { icon: MoonStar, title: "Eid celebrations", image: "/images/student-life/eid.jpg", body: "Eid al-Fitr and Eid al-Adha with prayers, shared meals and children's activities.", tint: "bg-sky-soft text-navy" },
  { icon: BookOpen, title: "Qur'an recitation contest", image: "/images/student-life/quran.jpg", body: "Students recite and memorise, with prizes for tajweed and fluency.", tint: "bg-gold-soft text-gold" },
  { icon: FlaskConical, title: "Science and ICT fair", image: "/images/student-life/science.jpg", body: "Projects from primary and secondary classes, judged by guest teachers and parents.", tint: "bg-sky-soft text-navy" },
];

/** Horizontal, scrollable row of student activity cards with previous and next buttons. */
export function StudentLife() {
  const track = useRef<HTMLUListElement>(null);
  const reduce = useReducedMotion();

  function scrollByCard(direction: 1 | -1) {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <div>
      <ul ref={track} className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-4 pb-4 [scrollbar-width:none] sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden">
        {ACTIVITIES.map((a, i) => (
          <motion.li
            key={a.title}
            initial={reduce ? false : { opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.28, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
            className="w-[78%] shrink-0 snap-start sm:w-[calc(50%-0.625rem)] lg:w-[calc(25%-0.9375rem)]"
          >
            <article className="group h-full overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="relative overflow-hidden">
                <PlaceholderImage src={a.image} alt={a.title} label="Photo coming soon" className="aspect-[4/3] w-full rounded-none border-0 transition duration-500 group-hover:scale-105" />
                <span className={cn("absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl shadow-md", a.tint)}><a.icon className="h-5 w-5" aria-hidden /></span>
              </div>
              <div className="p-5">
                <h3 className="font-display text-lg font-semibold text-navy-deep">{a.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{a.body}</p>
              </div>
            </article>
          </motion.li>
        ))}
      </ul>
      <div className="mt-6 flex justify-center gap-3">
        <button type="button" onClick={() => scrollByCard(-1)} className={cn(buttonVariants({ variant: "outline", size: "icon" }), "rounded-full")} aria-label="Previous activities"><ChevronLeft className="h-5 w-5" aria-hidden /></button>
        <button type="button" onClick={() => scrollByCard(1)} className={cn(buttonVariants({ variant: "primary", size: "icon" }), "rounded-full")} aria-label="Next activities"><ChevronRight className="h-5 w-5" aria-hidden /></button>
      </div>
    </div>
  );
}
