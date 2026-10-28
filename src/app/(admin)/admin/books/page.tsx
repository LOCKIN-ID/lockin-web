import Link from "next/link";
import type { Metadata } from "next";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { priceLabel } from "@/lib/format";

export const metadata: Metadata = {
  title: "Books Admin | LOCK.IN",
};

export default async function AdminBooksPage() {
  await requireAdmin();

  const books = await prisma.book.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="section">
      <div className="container">
        <header className="pagehead">
          <h1>Books &amp; Editions</h1>
          <p className="lead" style={{ color: "var(--color-ink-2)" }}>
            Configure book pricing, published state, and printable PDF assets.
          </p>
        </header>

        <div className="panel" style={{ marginTop: "var(--space-xl)", overflow: "hidden", background: "var(--color-paper-3)" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Tier &amp; Slug</th>
                <th>Title</th>
                <th>Price</th>
                <th>Pages</th>
                <th>PDF Status</th>
                <th>Published</th>
              </tr>
            </thead>
            <tbody>
              {books.map((b) => (
                <tr key={b.id}>
                  <td>
                    <span className="chip" style={{ fontSize: "var(--text-xs)" }}>
                      {b.tier}
                    </span>
                    <div style={{ fontFamily: "var(--font-outlier)", fontSize: "var(--text-xs)", color: "var(--color-muted)", marginTop: "var(--space-3xs)" }}>
                      {b.slug}
                    </div>
                  </td>
                  <td>
                    <strong>{b.title}</strong>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--color-ink-2)" }}>
                      {b.levelLabel}
                    </div>
                  </td>
                  <td style={{ fontFamily: "var(--font-outlier)" }}>
                    {b.priceIdr === 0 ? "Free" : priceLabel(b.priceIdr)}
                  </td>
                  <td style={{ fontFamily: "var(--font-outlier)" }}>
                    {b.pageCount}
                  </td>
                  <td>
                    {b.pdfPath ? (
                      <span className="chip" style={{ background: "color-mix(in oklab, var(--color-accent) 25%, var(--color-paper))", color: "var(--color-forest)", fontSize: "var(--text-xs)" }}>
                        ✓ Generated
                      </span>
                    ) : (
                      <span className="chip" style={{ background: "var(--color-paper-2)", color: "var(--color-muted)", fontSize: "var(--text-xs)" }}>
                        Pending build
                      </span>
                    )}
                  </td>
                  <td>
                    {b.publishedAt ? (
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-forest)", fontWeight: 600 }}>
                        Live ({b.publishedAt.toISOString().slice(0, 10)})
                      </span>
                    ) : (
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
                        Draft
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
