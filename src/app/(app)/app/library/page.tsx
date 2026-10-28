import Link from "next/link";
import type { Metadata } from "next";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { books } from "@/content/books";
import { bookPrice } from "@/content/plans";
import { accessFor, canOpen } from "@/lib/entitlements";
import { priceLabel } from "@/lib/format";

export const metadata: Metadata = {
  title: "My Library | LOCK.IN",
  description: "Your owned and accessible e-books and study materials.",
};

export default async function LibraryPage() {
  const session = await requireUser();
  const userId = session.user.id;

  const access = await accessFor(userId);

  // Get completed section counts for each book
  const progressRows = await prisma.readingProgress.findMany({
    where: { userId, completedAt: { not: null } },
    select: { bookSlug: true, sectionId: true },
  });

  const progressBySlug = progressRows.reduce<Record<string, number>>((acc, row) => {
    acc[row.bookSlug] = (acc[row.bookSlug] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="section">
      <div className="container">
        <header className="pagehead" data-reveal="up">
          <h1>Your Learning <span className="highlight-mint">Library</span></h1>
          <p className="lead" style={{ color: "var(--color-ink-2)" }}>
            High-density interactive books with real in-browser code execution.
          </p>
        </header>

        <div className="cols-3" data-reveal-group style={{ display: "grid", gap: "var(--space-xl)", marginTop: "var(--space-xl)" }}>
          {books.map((book) => {
            const price = bookPrice(book.slug);
            const unlocked = canOpen(access, { slug: book.slug, priceIdr: price });
            const totalSec = book.chapters.reduce((sum, ch) => sum + ch.sections.length, 0);
            const doneSec = progressBySlug[book.slug] ?? 0;
            const percent = totalSec > 0 ? Math.round((doneSec / totalSec) * 100) : 0;

            return (
              <article
                key={book.slug}
                className="panel"
                data-reveal="plate"
                style={{
                  padding: "var(--space-xl)",
                  background: "var(--color-paper-3)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  borderColor: unlocked ? "var(--color-rule)" : "var(--color-muted)",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-xs)" }}>
                    <span className="chip" style={{ background: "var(--color-paper-2)", color: "var(--color-forest)", fontWeight: 700 }}>
                      {book.levelLabel}
                    </span>
                    {unlocked ? (
                      <span className="chip" style={{ background: "color-mix(in oklab, var(--color-accent) 25%, var(--color-paper))", color: "var(--color-forest)", fontSize: "var(--text-xs)" }}>
                        ✓ Accessible
                      </span>
                    ) : (
                      <span className="chip" style={{ background: "var(--color-paper-2)", color: "var(--color-muted)", fontSize: "var(--text-xs)" }}>
                        Locked
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      height: "150px",
                      borderRadius: "var(--radius-card)",
                      overflow: "hidden",
                      marginBlock: "var(--space-sm)",
                      position: "relative",
                      border: "1px solid var(--color-rule)",
                      background: "var(--color-paper-2)",
                    }}
                  >
                    <img
                      src="/ebooks/cover-lockin.png"
                      alt={book.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  </div>
                  <h2 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-2xs)" }}>
                    {book.title}
                  </h2>
                  <p style={{ color: "var(--color-ink-2)", fontSize: "var(--text-sm)", lineHeight: 1.5, marginBottom: "var(--space-md)" }}>
                    {book.promise}
                  </p>

                  {/* Progress track if unlocked */}
                  {unlocked ? (
                    <div style={{ marginBlock: "var(--space-md)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-xs)", marginBottom: "var(--space-3xs)" }}>
                        <span>Progress</span>
                        <span style={{ fontFamily: "var(--font-outlier)" }}>{doneSec} / {totalSec} sections ({percent}%)</span>
                      </div>
                      <div style={{ height: "6px", background: "var(--color-paper-2)", borderRadius: "var(--radius-pill)", overflow: "hidden" }}>
                        <div style={{ width: `${percent}%`, height: "100%", background: "var(--color-forest)" }} />
                      </div>
                    </div>
                  ) : (
                    <div className="well" style={{ padding: "var(--space-sm) var(--space-md)", marginBlock: "var(--space-md)", fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
                      One-time price: <strong>{priceLabel(price)}</strong> or included with Pro
                    </div>
                  )}
                </div>

                <div style={{ marginTop: "var(--space-lg)", paddingTop: "var(--space-md)", borderTop: "1px solid var(--color-rule)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  {unlocked ? (
                    <Link href={`/app/books/${book.slug}`} className="btn btn--sm">
                      Open Reader
                    </Link>
                  ) : (
                    <Link href="/pricing" className="btn btn--sm">
                      View Options
                    </Link>
                  )}

                  <Link href={`/books/${book.slug}`} className="btn btn--quiet btn--sm">
                    Details
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
