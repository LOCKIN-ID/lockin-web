import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

import { requireUser } from "@/lib/auth";
import { getBook } from "@/content/books";
import { bookPrice } from "@/content/plans";
import { prisma } from "@/lib/prisma";
import { accessFor, canOpen } from "@/lib/entitlements";
import { ReaderShell } from "@/components/reader/reader-shell";
import { priceLabel } from "@/lib/format";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const book = getBook(slug);
  if (!book) return { title: "Book Not Found | LOCK.IN" };
  return {
    title: `${book.title} | Reader · LOCK.IN`,
    description: book.promise,
  };
}

export default async function ReaderPage({ params }: Props) {
  const session = await requireUser();
  const { slug } = await params;
  const book = getBook(slug);
  if (!book) notFound();

  // Entitlement gate check
  const access = await accessFor(session.user.id);
  const price = bookPrice(book.slug);
  const allowed = canOpen(access, { slug: book.slug, priceIdr: price });

  if (!allowed) {
    return (
      <div className="section">
        <div className="container" style={{ maxWidth: "680px", textAlign: "center" }}>
          <div
            className="panel"
            style={{
              padding: "var(--space-3xl) var(--space-xl)",
              background: "var(--color-paper-3)",
              display: "grid",
              gap: "var(--space-md)",
              placeItems: "center",
            }}
          >
            <h1>{book.title}</h1>
            <p style={{ color: "var(--color-ink-2)", fontSize: "var(--text-md)" }}>
              {book.promise}
            </p>

            <div
              className="well"
              style={{
                padding: "var(--space-lg)",
                width: "100%",
                maxWidth: "440px",
                marginBlock: "var(--space-sm)",
              }}
            >
              <div style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>Included with subscription</div>
              <div style={{ fontFamily: "var(--font-outlier)", fontSize: "var(--text-2xl)", fontWeight: 900 }}>
                {priceLabel(price)}
              </div>
            </div>

            <div style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap", justifyContent: "center" }}>
              <Link href={`/pricing`} className="btn">
                View upgrade options
              </Link>
              <Link href="/app/library" className="btn btn--quiet">
                &larr; Back to Library
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User has access! Fetch reading progress and bookmarks
  const progressRows = await prisma.readingProgress.findMany({
    where: {
      userId: session.user.id,
      bookSlug: book.slug,
      completedAt: { not: null },
    },
    select: { sectionId: true },
  });

  const bookmarkRows = await prisma.bookmark.findMany({
    where: {
      userId: session.user.id,
      bookSlug: book.slug,
    },
    select: { sectionId: true },
  });

  const bookRow = await prisma.book.findUnique({
    where: { slug: book.slug },
    select: { pdfPath: true },
  });

  const completedSectionIds = progressRows.map((r) => r.sectionId);
  const bookmarkedSectionIds = bookmarkRows.map((r) => r.sectionId);
  const hasPdf = Boolean(bookRow?.pdfPath);
  const tutorProvider = process.env.TUTOR_PROVIDER ?? "offline";

  return (
    <ReaderShell
      book={book}
      initialCompletedSectionIds={completedSectionIds}
      initialBookmarkedSectionIds={bookmarkedSectionIds}
      hasPdf={hasPdf}
      tutorProvider={tutorProvider}
    />
  );
}
