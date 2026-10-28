import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

import { HELP_ARTICLES, HELP_CATEGORIES } from "@/content/help";
import { Markdown } from "@/components/marketing/markdown";
import { Helper } from "@/components/help/helper";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return HELP_ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = HELP_ARTICLES.find((a) => a.slug === slug);
  if (!article) return { title: "Article Not Found | LOCK.IN" };
  return {
    title: `${article.title} | LOCK.IN Help`,
    description: article.summary,
  };
}

export default async function HelpArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = HELP_ARTICLES.find((a) => a.slug === slug);
  if (!article) notFound();

  const category = HELP_CATEGORIES.find((c) => c.slug === article.category);
  const related = HELP_ARTICLES.filter((a) => a.category === article.category && a.slug !== article.slug);

  const provider = process.env.TUTOR_PROVIDER ?? "offline";
  const whatsappUrl = process.env.WHATSAPP_SUPPORT_URL ?? null;

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: "860px" }}>
        {/* Navigation Breadcrumb */}
        <nav style={{ marginBottom: "var(--space-lg)", fontSize: "var(--text-sm)", color: "var(--color-muted)" }}>
          <Link href="/help">Help Centre</Link>
          <span style={{ marginInline: "var(--space-xs)" }}>/</span>
          <span>{category?.title ?? article.category}</span>
        </nav>

        {/* Article Header */}
        <header style={{ marginBottom: "var(--space-xl)", display: "grid", gap: "var(--space-sm)" }}>
          <span className="chip" style={{ width: "fit-content" }}>
            {category?.title ?? article.category}
          </span>
          <h1>{article.title}</h1>
          <p className="lead" style={{ color: "var(--color-ink-2)" }}>
            {article.summary}
          </p>
        </header>

        {/* Article Content */}
        <article
          className="panel"
          style={{
            padding: "var(--space-2xl)",
            background: "var(--color-paper-3)",
            lineHeight: 1.65,
          }}
        >
          <Markdown md={article.bodyMd} />
        </article>

        {/* Still Stuck? AI Helper */}
        <div style={{ marginTop: "var(--space-2xl)" }}>
          <h3 style={{ marginBottom: "var(--space-md)" }}>Still have questions about this topic?</h3>
          <Helper provider={provider} whatsappUrl={whatsappUrl} compact={true} tone="quiet" />
        </div>

        {/* Related Articles */}
        {related.length > 0 ? (
          <section style={{ marginTop: "var(--space-3xl)", borderTop: "1px solid var(--color-rule)", paddingTop: "var(--space-xl)" }}>
            <h3 style={{ marginBottom: "var(--space-md)" }}>Related articles in {category?.title}</h3>
            <div className="cols-2" style={{ display: "grid", gap: "var(--space-md)" }}>
              {related.slice(0, 4).map((rel) => (
                <div key={rel.slug} className="panel" style={{ padding: "var(--space-md)", background: "var(--color-paper-3)" }}>
                  <h4 style={{ fontSize: "var(--text-md)", marginBottom: "var(--space-3xs)" }}>
                    <Link href={`/help/${rel.slug}`}>{rel.title}</Link>
                  </h4>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--color-ink-2)" }}>{rel.summary}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Escalation bar */}
        <div style={{ marginTop: "var(--space-2xl)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/help" className="btn btn--quiet btn--sm">
            &larr; Back to all help articles
          </Link>
          <Link href="/contact" className="btn btn--sm">
            Open Support Ticket
          </Link>
        </div>
      </div>
    </div>
  );
}
