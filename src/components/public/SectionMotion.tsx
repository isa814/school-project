"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Reveal as MotionReveal } from "@/components/motion/Motion";

/** Scroll-reveal wrapper for public sections. */
export function Reveal({ children }: { children: React.ReactNode }) {
  return <MotionReveal>{children}</MotionReveal>;
}

/** Star divider that draws itself in when it appears. */
export function StarDivider() {
  const reduce = useReducedMotion();
  return (
    <motion.svg
      aria-hidden
      viewBox="0 0 200 24"
      className="mx-auto h-6 w-48 text-sky"
      initial={reduce ? false : { opacity: 0, scale: 0.6 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <path d="M100 2 L108 10 L118 12 L108 14 L100 22 L92 14 L82 12 L92 10 Z" fill="currentColor" opacity="0.7" />
      <line x1="0" y1="12" x2="82" y2="12" stroke="currentColor" strokeOpacity="0.5" />
      <line x1="118" y1="12" x2="200" y2="12" stroke="currentColor" strokeOpacity="0.5" />
    </motion.svg>
  );
}
