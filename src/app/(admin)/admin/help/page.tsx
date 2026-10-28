import Link from "next/link";
import type { Metadata } from "next";

import { requireAdmin } from "@/lib/auth";
import { HELP_ARTICLES, HELP_CATEGORIES } from "@/content/help";

export const metadata: Metadata = {
  title: "Help Articles Admin | LOCK.IN",
};

export default async function AdminHelpPage() {
  await requireAdmin();

  return (
    <div className="section">
      <div className="container">
        <header className="pagehead">
          <h1>Help Centre Articles</h1>
          <p className="lead" style={{ color: "var(--color-ink-2)" }}>
            Knowledge base articles referenced by the Socratic AI support coach.
          </p>
        </header>

        <div className="panel" style={{ marginTop: "var(--space-xl)", overflow: "hidden", background: "var(--color-paper-3)" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Title &amp; Slug</th>
                <th>Category</th>
                <th>Keywords for Socratic Match</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {HELP_ARTICLES.map((a) => {
                const category = HELP_CATEGORIES.find((c) => c.slug === a.category);

                return (
                  <tr key={a.slug}>
                    <td>
                      <strong>{a.title}</strong>
                      <div style={{ fontFamily: "var(--font-outlier)", fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
                        {a.slug}
                      </div>
                    </td>
                    <td>
                      <span className="chip" style={{ fontSize: "var(--text-xs)" }}>
                        {category?.title ?? a.category}
                      </span>
                    </td>
                    <td style={{ fontSize: "var(--text-xs)", color: "var(--color-ink-2)", maxWidth: "340px" }}>
                      {a.keywords}
                    </td>
                    <td>
                      <Link href={`/help/${a.slug}`} target="_blank" className="btn btn--quiet btn--sm" style={{ padding: "0 var(--space-xs)", height: "28px", minHeight: "28px" }}>
                        View Live
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
