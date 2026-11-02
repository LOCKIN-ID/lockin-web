import Link from "next/link";
import type { Metadata } from "next";

import "./books.css";
import { books } from "@/content/books";
import { TaglineStrip } from "@/components/marketing/tagline-strip";
import { BookManualCard, type BookSampleSnippet } from "@/components/marketing/book-manual-card";
export const metadata: Metadata = {
  title: "E-Books & Interactive Manuals | LOCK.IN",
  description: "Short, high-density, interactive e-books for developers. 15 to 25 pages, runnable snippets, physical QR quests, and integrated checkpoints.",
};

const COVER_MAP: Record<string, string> = {
  beginner: "/ebooks/cover-beginner.png",
  intermediate: "/ebooks/cover-intermediate.png",
  expert: "/ebooks/cover-expert.png",
};

const TIER_NUMBERS: Record<string, string> = {
  beginner: "TIER 01",
  intermediate: "TIER 02",
  expert: "TIER 03",
};

const BOOK_TOPICS: Record<string, string[]> = {
  beginner: ["HTML5 Structure", "CSS Cascade", "Box Model", "Forms & Input"],
  intermediate: ["Modern JavaScript", "DOM API", "Interactive State", "Event Dispatch"],
  expert: ["Python Automation", "BusyBox WASM", "Regex Pipelines", "Idempotent Cron"],
};

const BOOK_SNIPPETS: Record<string, BookSampleSnippet> = {
  beginner: {
    lang: "html",
    code: `<h1>LOCK.IN</h1>\n<p>Two tags, two boxes.</p>\n<button>Run inside browser</button>`,
    caption: "Edit tag HTML langsung dan lihat perubahannya seketika.",
    runtime: "Browser HTML Sandbox",
  },
  intermediate: {
    lang: "js",
    code: `const value = 12 + 5;\nconsole.log(value, typeof value);\n// output: 17 number`,
    caption: "Evaluasi state & event dispatch di sandbox worker mandiri.",
    runtime: "JS Web Worker Sandbox",
  },
  expert: {
    lang: "shell",
    code: `pwd\nls -a /home/student\npython3 script.py | grep "CRITICAL"`,
    caption: "Pipeline automasi Linux BusyBox WASM & Python Pyodide.",
    runtime: "Linux BusyBox WASM & Pyodide",
  },
};
interface BooksPageProps {
  searchParams: Promise<{ tier?: string }>;
}

export default async function BooksPage({ searchParams }: BooksPageProps) {
  const { tier } = await searchParams;
  const activeTier = tier?.toLowerCase() ?? "all";

  const filteredBooks = activeTier === "all"
    ? books
    : books.filter((b) => b.tier.toLowerCase() === activeTier);

  return (
    <div className="section">
      <div className="container">
        {/* Modern Split Hero */}
        <header className="books-hero" data-reveal="up">
          <div className="books-hero__main">
            <div style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2xs)", marginBottom: "var(--space-xs)" }}>
              <span className="chip" style={{ background: "var(--color-paper-2)", color: "var(--color-forest)", fontWeight: 700 }}>
                Curated Developer Series
              </span>
              <span className="chip" style={{ background: "transparent", color: "var(--color-ink-2)" }}>
                15 to 25 Pages Each
              </span>
            </div>

            <h1>Practical code, <span className="highlight-mint">zero fluff</span>.</h1>
            <p className="books-hero__lead">
              Every concept is tested by running real code in your browser.
            </p>

            <nav className="books-hero__rail" aria-label="Filter catalogue by tier">
              <Link
                href="/books"
                className="chip"
                aria-current={activeTier === "all" ? "page" : undefined}
              >
                All tiers ({books.length})
              </Link>
              <Link
                href="/books?tier=beginner"
                className="chip"
                aria-current={activeTier === "beginner" ? "page" : undefined}
              >
                Beginner (Free)
              </Link>
              <Link
                href="/books?tier=intermediate"
                className="chip"
                aria-current={activeTier === "intermediate" ? "page" : undefined}
              >
                Intermediate
              </Link>
              <Link
                href="/books?tier=expert"
                className="chip"
                aria-current={activeTier === "expert" ? "page" : undefined}
              >
                Expert
              </Link>
            </nav>
          </div>

          <div className="books-hero__deck">
            <h3 className="books-hero__deck-title">The LOCK.IN Standard</h3>
            <ul className="books-hero__features">
              <li className="books-hero__feature-item">
                <span className="books-hero__feature-pill">15-25 P</span>
                <span>Strictly bounded scope without theoretical padding or redundant filler.</span>
              </li>
              <li className="books-hero__feature-item">
                <span className="books-hero__feature-pill">WASM</span>
                <span>4 in-browser runtimes: HTML, JavaScript, Python Pyodide, and Linux BusyBox.</span>
              </li>
              <li className="books-hero__feature-item">
                <span className="books-hero__feature-pill">QR</span>
                <span>Physical print chapter QR codes link directly to interactive quest repos.</span>
              </li>
              <li className="books-hero__feature-item">
                <span className="books-hero__feature-pill">AI</span>
                <span>Socratic coach offers step-by-step hint ladders without spoiling solutions.</span>
              </li>
            </ul>
          </div>
        </header>

        {/* Animated Feature Strip */}
        <div style={{ marginBlock: "var(--space-md)" }} data-reveal="up">
          <TaglineStrip
            tone="paper"
            items={["15 TO 25 PAGES PER BOOK", "100% RUNNABLE CODE", "INTEGRATED CHECKPOINTS", "STARTER REPOSITORIES", "SOCRATIC HINTS"]}
          />
        </div>

        {/* Books Catalogue Grid */}
        <div className="catalogue" data-reveal-group>
          {filteredBooks.map((book) => (
            <BookManualCard
              key={book.slug}
              book={book}
              coverSrc={COVER_MAP[book.slug] ?? "/ebooks/cover-lockin.png"}
              tierNumber={TIER_NUMBERS[book.slug] ?? "TIER"}
              topics={BOOK_TOPICS[book.slug] ?? []}
              snippet={
                BOOK_SNIPPETS[book.slug] ?? {
                  lang: "code",
                  code: "// Code snippet",
                  caption: "Runnable code snippet",
                  runtime: "Browser Sandbox",
                }
              }
            />
          ))}
        </div>

        {/* Value Proposition Deck */}
        <section className="books-ecosystem" data-reveal="up">
          <div className="books-ecosystem__head">
            <h2>Built for the <span className="highlight-mint">new developer era</span></h2>
            <p style={{ color: "var(--color-ink-2)", maxWidth: "60ch", margin: "var(--space-2xs) auto 0" }}>
              Why reading a LOCK.IN book feels completely different from a standard programming manual.
            </p>
          </div>

          <div className="books-ecosystem__grid">
            <div className="books-ecosystem__card">
              <h4>In-Browser Execution</h4>
              <p>
                Every code sample runs directly in your browser. Experiment with HTML, JavaScript, Python Pyodide, and Linux BusyBox WASM without installing tools.
              </p>
            </div>

            <div className="books-ecosystem__card">
              <h4>Physical QR Bridges</h4>
              <p>
                Reading offline? Every printed chapter includes high-resolution QR codes that launch GitHub starter repos, quiz challenges, and live coding exercises.
              </p>
            </div>

            <div className="books-ecosystem__card">
              <h4>Socratic AI Hints</h4>
              <p>
                Our AI coach refuses to spoon-feed answers. It diagnoses confusion, clarifies intent, and provides structured hints to let you discover the solution yourself.
              </p>
            </div>

            <div className="books-ecosystem__card">
              <h4>XP and Verified Badges</h4>
              <p>
                Earn experience points for completed checkpoints and daily reading streaks. Redeem XP for cheatsheets and course coupons in the reward store.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
