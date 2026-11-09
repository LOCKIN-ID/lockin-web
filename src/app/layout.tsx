import type { Metadata } from "next";
import Script from "next/script";
import localFont from "next/font/local";
import { Space_Grotesk, Plus_Jakarta_Sans, Archivo, Inter, JetBrains_Mono } from "next/font/google";

import { Reveal } from "@/components/motion/reveal";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { SectionScroller } from "@/components/motion/section-scroller";

import "./globals.css";

const valorant = localFont({
  src: "./fonts/valorant.ttf",
  variable: "--font-valorant",
  display: "swap",
});
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap" });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });
const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono-code", display: "swap" });
const siteUrl = process.env.APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "LOCK.IN",
  title: {
    default: "LOCK.IN",
    template: "%s | LOCK.IN",
  },
  description:
    "LOCK.IN sells short interactive e-books: 15 to 25 pages that teach by making you run the code, with a Socratic coach, QR quests and XP you can spend on rewards.",
  openGraph: {
    type: "website",
    locale: "en_ID",
    siteName: "LOCK.IN",
    title: "LOCK.IN",
    description:
      "15 to 25 pages per book, three levels, four runtimes in the browser, a coach that hints instead of answering.",
    url: siteUrl,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${valorant.variable} ${spaceGrotesk.variable} ${plusJakarta.variable} ${archivo.variable} ${inter.variable} ${jetbrains.variable}`}
      // The inline script below adds `.js` to this element before hydration, which
      // is the documented pattern for content that must stay readable without
      // scripting: an inline script plus this suppression on the element it edits.
      suppressHydrationWarning
    >
      <body>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <script
          // Hallmark 62: reveal patterns hide only under `.js`, so the page reads
          // with scripting off.
          dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }}
        />
        <SmoothScroll />
        <SectionScroller />
        <Reveal />
        <a className="skip" href="#main">
          Skip to content
        </a>
        {children}
        {/* Cloudflare Web Analytics: cookieless page counts. Added by hand because
          * a Workers/Pages deploy gets no beacon injection at the edge. */}
        <Script
          src="https://static.cloudflareinsights.com/beacon.min.js"
          type="module"
          data-cf-beacon='{"token": "745620f91663455395bbb2caaad73650"}'
        />
      </body>
    </html>
  );
}
