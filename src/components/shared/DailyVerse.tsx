import { BookOpen } from "lucide-react";

/** Verses and hadith with their references. Arabic text is shown alongside the English meaning. */
const VERSES = [
  { ar: "اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ", en: "Read in the name of your Lord who created.", ref: "Qur'an 96:1" },
  { ar: "وَقُل رَّبِّ زِدْنِي عِلْمًا", en: "And say: My Lord, increase me in knowledge.", ref: "Qur'an 20:114" },
  { ar: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا", en: "Indeed, with hardship comes ease.", ref: "Qur'an 94:6" },
  { ar: "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ", en: "The best of you are those who learn the Qur'an and teach it.", ref: "Sahih al-Bukhari" },
  { ar: "طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ", en: "Seeking knowledge is an obligation upon every Muslim.", ref: "Sunan Ibn Majah" },
];

/** Rotates through the list by day of the year, so the verse changes each day. */
export function DailyVerse({ className }: { className?: string }) {
  const day = Math.floor((Date.now() + 3600_000) / 86_400_000);
  const v = VERSES[day % VERSES.length];
  return (
    <figure className={className}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-gold">
        <BookOpen className="h-3.5 w-3.5" aria-hidden /> Word of the day
      </div>
      <p className="mt-3 text-right font-display text-2xl leading-loose text-white" lang="ar" dir="rtl">{v.ar}</p>
      <blockquote className="mt-3 text-base italic leading-relaxed text-white/90">&ldquo;{v.en}&rdquo;</blockquote>
      <figcaption className="mt-2 text-sm text-sky">{v.ref}</figcaption>
    </figure>
  );
}
