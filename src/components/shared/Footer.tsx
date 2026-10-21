import Link from "next/link";
import { Logo } from "@/components/shared/Logo";

export function Footer() {
  return (
    <footer className="lattice-navy text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 xl:grid-cols-5">
        <div className="md:col-span-2">
          <Logo tone="light" href={null} />
          <p className="mt-4 max-w-md text-sm leading-relaxed text-sky/90">
            Nurturing knowledgeable, disciplined and God-conscious young people from Nursery through Senior Secondary. Knowledge is light.
          </p>
        </div>
        <div>
          <h2 className="font-display text-base font-semibold text-white">Explore</h2>
          <ul className="mt-3 space-y-2 text-sm text-sky/90">
            <li><Link className="hover:text-white" href="/about">About us</Link></li>
            <li><Link className="hover:text-white" href="/academics">Academics</Link></li>
            <li><Link className="hover:text-white" href="/admissions">Admissions</Link></li>
            <li><Link className="hover:text-white" href="/policies">Policies</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="font-display text-base font-semibold text-white">School life</h2>
          <ul className="mt-3 space-y-2 text-sm text-sky/90">
            <li><Link className="hover:text-white" href="/teachers">Teachers</Link></li>
            <li><Link className="hover:text-white" href="/news">News &amp; events</Link></li>
            <li><Link className="hover:text-white" href="/gallery">Gallery</Link></li>
            <li><Link className="hover:text-white" href="/forum">Parent forum</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="font-display text-base font-semibold text-white">Contact</h2>
          <ul className="mt-3 space-y-2 text-sm text-sky/90">
            <li>Lagos, Nigeria</li>
            <li>+234 800 000 0000</li>
            <li><a className="break-all hover:text-white" href="mailto:hamsabdigitalsolutions@gmail.com">hamsabdigitalsolutions@gmail.com</a></li>
            <li><Link className="hover:text-white" href="/portal/login">Portal login</Link></li>
            <li><Link className="hover:text-white" href="/privacy">Privacy policy</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-sky/80">
        © {new Date().getFullYear()} Ansar Ruhul Islam Nursery, Primary &amp; Secondary School. All rights reserved.
      </div>
    </footer>
  );
}
