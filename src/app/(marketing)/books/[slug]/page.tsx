import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

import "../books.css";
import { books, getBook } from "@/content/books";
import { priceLabel } from "@/lib/format";
import { BlockRenderer } from "@/components/reader/block-renderer";

const COVER_MAP: Record<string, string> = {
  beginner: "/ebooks/cover-beginner.png",
  intermediate: "/ebooks/cover-intermediate.png",
  expert: "/ebooks/cover-expert.png",
};
interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return books.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const book = getBook(slug);
  if (!book) return { title: "Book Not Found | LOCK.IN" };
  return {
    title: `${book.title} | LOCK.IN`,
    description: book.promise,
  };
}

export default async function BookDetailPage({ params }: Props) {
  const { slug } = await params;
  const book = getBook(slug);
  if (!book) notFound();

  const free = book.priceIdr === 0;
  const ch1 = book.chapters[0];
  const previewSections = ch1 ? ch1.sections.slice(0, 2) : [];

  return (
    <article className="section">
      <div className="container">
        {/* Header */}
        <header className="pagehead" data-reveal="up">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--space-2xl)", alignItems: "center", width: "100%" }}>
            <div style={{ display: "grid", gap: "var(--space-md)" }}>
              <h1>
                <span className="highlight-mint">{book.title.split(":")[0]}</span>
                {book.title.includes(":") ? `:${book.title.split(":")[1]}` : ""}
              </h1>
              <div className="book-meta">
                <span className="chip" style={{ color: "var(--color-forest)", fontWeight: 700 }}>
                  {book.levelLabel}
                </span>
                <span className="book-meta__pages">
                  {book.pageCount} pages
                </span>
              </div>
              <p className="lead" style={{ color: "var(--color-ink-2)" }}>{book.promise}</p>

              <div className="book-buy">
                <span className="book-buy__price">{free ? "Free" : priceLabel(book.priceIdr ?? 0)}</span>
                {free ? (
                  <Link href={`/app/books/${book.slug}`} className="btn">
                    Open in Reader
                  </Link>
                ) : (
                  <Link href={`/pricing`} className="btn" id="buy">
                    Buy E-Book
                  </Link>
                )}
              </div>
            </div>

            <div style={{ maxWidth: "260px", justifySelf: "center", width: "100%", borderRadius: "var(--radius-card)", overflow: "hidden", border: "1px solid var(--color-rule)", boxShadow: "var(--shadow-raised)" }}>
              <img
                src={COVER_MAP[book.slug] ?? "/ebooks/cover-lockin.png"}
                alt={`${book.title} cover`}
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </div>
          </div>
        </header>

        {/* What is inside: the six names on the screen, the goal one click away. */}
        <section className="book-inside">
          <h2 style={{ marginBottom: "var(--space-lg)" }}>What is <span className="highlight-mint">inside</span></h2>
          <div className="cols-2">
            <div className="panel" style={{ padding: "var(--space-xl)", background: "var(--color-paper-3)" }}>
              <h3>All {book.chapters.length} chapters</h3>
              <ol className="chapter-list">
                {book.chapters.map((ch, idx) => (
                  <li key={ch.id}>
                    <details className="chapter">
                      <summary>
                        <span className="chapter__n">{idx + 1}</span>
                        <strong>{ch.title}</strong>
                      </summary>
                      <p className="chapter__goal">{ch.goal}</p>
                    </details>
                  </li>
                ))}
              </ol>
            </div>

            <div className="panel" style={{ padding: "var(--space-xl)", background: "var(--color-paper-3)" }}>
              <h3>Quests and Challenges</h3>
              <ul style={{ marginTop: "var(--space-md)", display: "grid", gap: "var(--space-sm)" }}>
                {book.quests.map((q) => (
                  <li key={q.slug} style={{ display: "flex", gap: "var(--space-sm)", alignItems: "center" }}>
                    <span className="chip" style={{ background: "var(--color-paper)", textTransform: "capitalize" }}>
                      {q.kind.replace("_", " ")}
                    </span>
                    <div>
                      <strong>{q.title}</strong>
                      <span style={{ marginLeft: "var(--space-xs)", fontSize: "var(--text-xs)", color: "var(--color-ink-2)", fontFamily: "var(--font-outlier)" }}>
                        +{q.xp} XP
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Chapter 1 sample: the whole first sections, kept in the HTML and behind one click. */}
        {ch1 ? (
          <section className="book-sample">
            <div className="book-head">
              <h2>Chapter 1: {ch1.title}</h2>
            </div>
            <details className="disclosure">
              <summary>Read the first chapter</summary>
              <div className="disclosure__body">
                {previewSections.map((sec) => (
                  <div key={sec.id} className="panel" style={{ padding: "var(--space-xl)", background: "var(--color-paper-3)" }}>
                    <h3 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-sm)" }}>{sec.title}</h3>
                    <BlockRenderer blocks={sec.body} bookSlug={book.slug} />
                  </div>
                ))}
              </div>
            </details>
          </section>
        ) : null}

        {/* Soft Gate Card */}
        <section className="book-gate">
          <div
            className="panel"
            style={{
              padding: "var(--space-xl)",
              textAlign: "center",
              background: "var(--color-paper-2)",
              border: "2px dashed var(--color-rule)",
            }}
          >
            <h3>The other 5 chapters</h3>
            <p style={{ color: "var(--color-ink-2)", maxWidth: "50ch", margin: "var(--space-sm) auto 0" }}>
              Every interactive code checkpoint, the PDF edition, Quests and Socratic AI.
            </p>
            <div style={{ marginTop: "var(--space-md)" }}>
              {free ? (
                <Link href={`/app/books/${book.slug}`} className="btn">
                  Start Reading Now
                </Link>
              ) : (
                <Link href="/pricing" className="btn">
                  Read with Pro or Lifetime
                </Link>
              )}
            </div>
          </div>
        </section>
      </div>
    </article>
  );
}
