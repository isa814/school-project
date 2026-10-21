"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/motion/Motion";
import { signOut } from "next-auth/react";
import { LogOut, Menu, X } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Avatar } from "@/components/portal/Avatar";
import { cn } from "@/lib/utils";
import { NAV_ICONS, type NavIconName } from "@/components/shared/nav-icons";

export type NavItem = { href: string; label: string; icon: NavIconName; perm?: string };

export function DashboardShell({ area, userName, avatarUrl, roleLabel, nav, children }: {
  area: string; userName: string; avatarUrl?: string | null; roleLabel: string; nav: NavItem[]; children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-5 py-5">
        <Logo tone="light" href={null} />
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-sky">{area}</p>
      </div>
      <nav aria-label={`${area} navigation`} className="flex-1 space-y-1 overflow-y-auto p-3">
        {nav.map((item) => {
          const isHome = item.href === nav[0]?.href;
          const active = isHome ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = NAV_ICONS[item.icon];
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "focus-ring group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200",
                active ? "text-navy-deep" : "text-white/85 hover:bg-white/10 hover:text-white",
              )}
            >
              {active && <motion.span layoutId="portal-nav-active" className="absolute inset-0 rounded-xl bg-sky shadow-lg" transition={{ type: "spring", stiffness: 380, damping: 32 }} aria-hidden />}
              <Icon className="relative h-4.5 w-4.5 shrink-0 transition-transform duration-300 group-hover:scale-110" aria-hidden />
              <span className="relative">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <Avatar name={userName} src={avatarUrl} size={40} className="rounded-xl ring-white/30" />
          <p className="truncate text-sm font-semibold text-white">{userName}</p>
        </div>
        <p className="text-xs text-sky/80">{roleLabel}</p>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/portal/login" })}
          className="focus-ring mt-3 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-white/85 hover:bg-white/10"
        >
          <LogOut className="h-4 w-4" aria-hidden /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-muted lg:flex">
      {/* Desktop sidebar */}
      <aside className="lattice-navy sticky top-0 hidden h-screen w-64 shrink-0 lg:block">{sidebar}</aside>

      {/* Mobile top bar + drawer */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-navy/10 bg-white px-4 py-3 lg:hidden">
        <Logo href={null} />
        <button type="button" onClick={() => setOpen(true)} className="focus-ring rounded-lg p-2 text-navy" aria-label="Open navigation" aria-expanded={open}>
          <Menu className="h-6 w-6" />
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-navy-deep/60" aria-label="Close navigation" onClick={() => setOpen(false)} />
          <div className="lattice-navy absolute left-0 top-0 h-full w-72 max-w-[85%] shadow-2xl">
            <button type="button" onClick={() => setOpen(false)} className="focus-ring absolute right-3 top-3 rounded-lg p-2 text-white" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </div>
        </div>
      )}

      <main id="main" className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10"><PageTransition key={pathname}>{children}</PageTransition></main>
    </div>
  );
}
