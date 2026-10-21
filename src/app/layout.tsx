import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const display = localFont({ src: "../../public/fonts/fraunces-variable-latin.woff2", weight: "100 900", variable: "--font-display", display: "swap" });
const sans = localFont({ src: "../../public/fonts/plus-jakarta-sans-variable-latin.woff2", weight: "200 800", variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? "http://localhost:3000"),
  title: { default: "Ansar Ruhul Islam Nursery, Primary & Secondary School", template: "%s | Ansar Ruhul Islam" },
  description: "Ansar Ruhul Islam Nursery, Primary and Secondary School, Lagos. Knowledge is light.",
  openGraph: { type: "website", siteName: "Ansar Ruhul Islam School", locale: "en_NG" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#0235A4", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
