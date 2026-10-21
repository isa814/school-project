"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { buttonVariants } from "@/components/ui";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/academics", label: "Academics" },
  { href: "/admissions", label: "Admissions" },
  { href: "/contact", label: "Contact" },
];

export function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const prefetch = (href: string) => () => router.prefetch(href);
  return (
    <header className="sticky top-0 z-40 border-b border-navy/10 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 xl:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} onMouseEnter={prefetch(l.href)} onFocus={prefetch(l.href)} className="focus-ring inline-flex min-h-11 items-center whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-sky-soft hover:text-navy">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 xl:flex">
          <Link href="/portal/login" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>Portal Login</Link>
          <Link href="/admissions" className={cn(buttonVariants({ variant: "primary", size: "sm" }))}>Apply Now</Link>
        </div>
        <button type="button" className="focus-ring rounded-lg p-2 text-navy xl:hidden" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          <span className="sr-only">Toggle menu</span>
        </button>
      </div>
        <nav id="mobile-nav" aria-label="Mobile" aria-hidden={!open} className={cn("absolute left-0 right-0 top-full origin-top border-t border-navy/10 bg-white px-4 pb-5 pt-2 shadow-lg transition duration-200 ease-out xl:hidden", open ? "visible translate-y-0 opacity-100" : "invisible pointer-events-none -translate-y-2 opacity-0")}>
          <ul className="flex flex-col">
            {LINKS.map((l) => (
              <li key={l.href}><Link onMouseEnter={prefetch(l.href)} onFocus={prefetch(l.href)} onClick={() => setOpen(false)} href={l.href} className="block rounded-lg px-3 py-3 font-medium text-ink hover:bg-sky-soft">{l.label}</Link></li>
            ))}
          </ul>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link onClick={() => setOpen(false)} href="/portal/login" className={cn(buttonVariants({ variant: "outline" }))}>Portal Login</Link>
            <Link onClick={() => setOpen(false)} href="/admissions" className={cn(buttonVariants({ variant: "primary" }))}>Apply Now</Link>
          </div>
        </nav>
    </header>
  );
}
