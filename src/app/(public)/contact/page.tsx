import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { contactAction } from "@/app/actions/public";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Notice, Textarea } from "@/components/ui";
import { Section, SectionTitle } from "@/components/public/Section";

export const metadata: Metadata = { title: "Contact us", description: "Contact Ansar Ruhul Islam School. Send an enquiry or visit the school office." };

export default function ContactPage({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  return (
    <Section>
      <SectionTitle eyebrow="Contact" title="We would love to hear from you" description="Send us a message and the school office will respond." />
      <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4 pt-6 text-sm text-slate-700">
              {/* TODO: replace with the school's real contact details */}
              <p className="flex gap-3"><MapPin className="h-5 w-5 shrink-0 text-navy" aria-hidden /> Lagos, Nigeria (full address to be confirmed)</p>
              <p className="flex gap-3"><Phone className="h-5 w-5 shrink-0 text-navy" aria-hidden /> +234 800 000 0000</p>
              <p className="flex gap-3"><Mail className="h-5 w-5 shrink-0 text-navy" aria-hidden /> <a className="break-all text-navy hover:underline" href="mailto:hamsabdigitalsolutions@gmail.com">hamsabdigitalsolutions@gmail.com</a></p>
            </CardContent>
          </Card>
          <div className="flex h-56 items-center justify-center rounded-2xl border border-dashed border-navy/30 bg-sky-soft text-sm text-navy-deep" role="img" aria-label="Map placeholder">
            {/* TODO: embed the Google Maps iframe for the school's location */}
            Map placeholder
          </div>
        </div>
        <Card>
          <CardHeader><CardTitle>Send a message</CardTitle></CardHeader>
          <CardContent>
            {searchParams.ok && <div className="mb-4"><Notice tone="success">{searchParams.ok}</Notice></div>}
            {searchParams.err && <div className="mb-4"><Notice tone="error">{searchParams.err}</Notice></div>}
            <form action={contactAction} className="grid gap-5 sm:grid-cols-2">
              <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden"><label>Website <input name="website" tabIndex={-1} autoComplete="off" /></label></div>
              <div><Label htmlFor="name">Your name *</Label><Input id="name" name="name" required minLength={2} /></div>
              <div><Label htmlFor="email">Email *</Label><Input id="email" name="email" type="email" required /></div>
              <div><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" type="tel" /></div>
              <div><Label htmlFor="subject">Subject *</Label><Input id="subject" name="subject" required minLength={3} /></div>
              <div className="sm:col-span-2"><Label htmlFor="message">Message *</Label><Textarea id="message" name="message" required minLength={10} /></div>
              <div className="sm:col-span-2"><Button type="submit">Send message</Button></div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Section>
  );
}
