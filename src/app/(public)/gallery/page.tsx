import type { Metadata } from "next";
import { Section, SectionTitle } from "@/components/public/Section";
import { PlaceholderImage } from "@/components/shared/PlaceholderImage";
import { Stagger, StaggerItem } from "@/components/motion/Motion";

export const metadata: Metadata = { title: "Gallery", description: "Photos of school life at Ansar Ruhul Islam School." };

// Use the school life images already bundled with the project until staff upload
// a curated set of official gallery photographs.
const TILES: { label: string; src: string | null; tint: string }[] = [
  { label: "Campus and learning spaces", src: "/images/campus/campus.jpg", tint: "bg-sky-soft" },
  { label: "Quiz competitions", src: "/images/student-life/quiz.jpg", tint: "bg-gold-soft" },
  { label: "Qur'an and Islamic learning", src: "/images/student-life/quran.jpg", tint: "bg-sky-soft" },
  { label: "Sports day", src: "/images/student-life/sports-day.jpg", tint: "bg-gold-soft" },
  { label: "Science and ICT activities", src: "/images/student-life/science.jpg", tint: "bg-sky-soft" },
  { label: "School celebrations", src: "/images/student-life/eid.jpg", tint: "bg-gold-soft" },
];

export default function GalleryPage() {
  return (
    <Section>
      <SectionTitle eyebrow="Gallery" title="Life at Ansar Ruhul Islam" description="A glimpse of learning, faith and school life." />
      <Stagger as="ul" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TILES.map((t) => (
          <StaggerItem key={t.label} as="li">
            <div className="group transition duration-300 hover:-translate-y-1">
              <PlaceholderImage src={t.src} alt={t.label} label={t.label} className={`aspect-[4/3] w-full shadow-card transition duration-300 group-hover:shadow-xl ${t.tint}`} />
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}
