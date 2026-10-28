import Link from "next/link";
import type { Metadata } from "next";

import "./books.css";
import { books } from "@/content/books";
import { priceLabel } from "@/lib/format";
import { TaglineStrip } from "@/components/marketing/tagline-strip";

export const metadata: Metadata = {
  title: "E-Books | LOCK.IN",
  description: "Short, high-density, interactive e-books for developers. 15 to 25 pages, runnable snippets, and integrated quizzes.",
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
        <header className="pagehead" data-reveal="up">
          <h1>Short, dense, <span className="highlight-mint">runnable</span>.</h1>
          <p className="lead" style={{ color: "var(--color-ink-2)" }}>
            15 to 25 pages each. Every concept tested by writing code.
          </p>

          <nav className="rail" aria-label="Filter catalogue by tier" style={{ marginTop: "var(--space-sm)" }}>
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
        </header>

        {/* The printed edition's one mechanism, in the width of a note. Outside the
            hero: the hero is a headline and one sentence, then the catalogue. */}
        <p className="well catalogue-note" data-reveal="up">
          A QR code on every printed chapter opens the same lesson online: quiz, starter repo, challenge bank.
        </p>

        <div style={{ marginBlock: "var(--space-md)" }} data-reveal="up">
          <TaglineStrip
            tone="paper"
            items={["15 TO 25 PAGES PER BOOK", "100% RUNNABLE CODE", "INTEGRATED CHECKPOINTS", "STARTER REPOSITORIES", "SOCRATIC HINTS"]}
          />
        </div>
        <div className="catalogue" data-reveal-group>
          {filteredBooks.map((book) => {
            const sectionCount = book.chapters.reduce((n, ch) => n + ch.sections.length, 0);
            const free = book.priceIdr === 0;

            return (
              <article key={book.slug} className="panel book-row" data-reveal="plate">
                <div
                  className="book-row__plate"
                  style={{
                    position: "relative",
                    overflow: "hidden",
                    padding: 0,
                    borderRadius: "var(--radius-card)",
                    border: "1px solid var(--color-rule)",
                    background: "var(--color-forest-deep)",
                    height: "100%",
                    minHeight: "220px",
                  }}
                >
                  <img
                    src="/ebooks/cover-lockin.png"
                    alt={`${book.title} cover`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(to top, rgba(15, 40, 30, 0.92) 0%, rgba(15, 40, 30, 0.2) 65%, transparent 100%)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                      padding: "var(--space-md)",
                    }}
                  >
                    <span className="book-row__tier" style={{ color: "var(--color-paper)", fontSize: "var(--text-lg)" }}>
                      {book.levelLabel}
                    </span>
                    <span className="book-row__pages" style={{ color: "var(--color-paper-2)", fontSize: "var(--text-xs)" }}>
                      {book.pageCount} pages
                    </span>
                  </div>
                </div>

                <div className="book-row__body">
                  <h2 className="book-row__title">
                    <Link href={`/books/${book.slug}`}>{book.title}</Link>
                  </h2>
                  <p className="book-row__promise">{book.promise}</p>
                  <p className="book-row__count">
                    {book.chapters.length} chapters, {sectionCount} sections
                  </p>
                </div>

                <div className="book-row__buy">
                  <span className="book-row__price">{free ? "Free" : priceLabel(book.priceIdr ?? 0)}</span>
                  <Link href={free ? `/app/books/${book.slug}` : `/books/${book.slug}#buy`} className="btn">
                    {free ? "Read Free" : "Buy E-Book"}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
