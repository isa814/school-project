import Image from "next/image";
import { ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Photo slot for the public website. Shows the real photo when a src is set, otherwise a labelled
 * placeholder tile so layouts stay correct until the school sends its images.
 */
export function PlaceholderImage({ src, alt, label = "Photo coming soon", className, sizes = "100vw", priority = false }: {
  src?: string | null;
  alt: string;
  label?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  if (src) {
    return (
      <div className={cn("relative overflow-hidden rounded-2xl bg-sky-soft", className)}>
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      </div>
    );
  }
  return (
    <div role="img" aria-label={`${alt}. ${label}`} className={cn("flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-navy/20 bg-sky-soft/70 p-6 text-center text-navy/70", className)}>
      <ImagePlus className="h-8 w-8" aria-hidden />
      <span className="text-sm font-semibold text-navy-deep">{label}</span>
      <span className="text-xs text-slate-500">{alt}</span>
    </div>
  );
}
