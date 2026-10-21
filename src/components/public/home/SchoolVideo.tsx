import { Play } from "lucide-react";

/**
 * School environment video. Plays public/videos/school-life.mp4 when the file exists.
 * Otherwise shows a labelled placeholder with the upload path, so the school can add its clip later.
 */
export function SchoolVideo({ hasVideo }: { hasVideo: boolean }) {
  if (hasVideo) {
    return (
      <video className="aspect-video w-full rounded-3xl bg-navy-deep shadow-2xl" controls playsInline preload="metadata" aria-label="A walk through Ansar Ruhul Islam School">
        <source src="/videos/school-life.mp4" type="video/mp4" />
        Your browser cannot play this video.
      </video>
    );
  }
  return (
    <div role="img" aria-label="School video placeholder" className="relative flex aspect-video w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-3xl bg-gradient-to-br from-navy to-navy-deep text-center text-white shadow-2xl">
      <span className="absolute inset-0 opacity-20 lattice-navy" aria-hidden />
      <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gold text-navy-deep shadow-xl transition duration-300 hover:scale-110"><Play className="ml-1 h-8 w-8 fill-current" aria-hidden /></span>
      <p className="relative font-display text-2xl font-semibold">A day at Ansar Ruhul Islam</p>
      <p className="relative max-w-md px-6 text-sm text-white/80">Video placeholder. Upload a school clip as <code className="rounded bg-white/10 px-1.5 py-0.5">public/videos/school-life.mp4</code> and it will play here.</p>
    </div>
  );
}
