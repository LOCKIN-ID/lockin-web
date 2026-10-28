"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import type { HelpArticleSeed, HelpCategory } from "@/content/help";

interface Props {
  articles: HelpArticleSeed[];
  categories: HelpCategory[];
}

const POPULAR_KEYWORDS = [
  "Refund",
  "Python",
  "Streak",
  "QR codes",
  "Password",
  "Payment",
];

export function HelpSearchList({ articles, categories }: Props) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of articles) {
      counts[a.category] = (counts[a.category] ?? 0) + 1;
    }
    return counts;
  }, [articles]);

  const filtered = useMemo(() => {
    let result = articles;
    if (selectedCategory !== "all") {
      result = result.filter((a) => a.category === selectedCategory);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.keywords.toLowerCase().includes(q),
      );
    }
    return result;
  }, [articles, query, selectedCategory]);

  const handleCategoryToggle = (slug: string) => {
    setSelectedCategory((prev) => (prev === slug ? "all" : slug));
  };

  return (
    <div style={{ display: "grid", gap: "var(--space-2xl)" }}>
      {/* 5-Card Category Quick-Nav Deck */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "var(--space-md)" }}>
          <h3 style={{ fontSize: "var(--text-md)", color: "var(--color-ink)", margin: 0 }}>
            Browse by domain
          </h3>
          {selectedCategory !== "all" && (
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--color-forest)",
                fontSize: "var(--text-xs)",
                fontFamily: "var(--font-outlier)",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Show all categories
            </button>
          )}
        </div>

        <div className="help-categories-grid" role="tablist" aria-label="Browse categories">
          {categories.map((cat) => {
            const count = categoryCounts[cat.slug] ?? 0;
            const isActive = selectedCategory === cat.slug;

            return (
              <button
                key={cat.slug}
                type="button"
                className="help-cat-card"
                data-active={isActive ? "true" : "false"}
                onClick={() => handleCategoryToggle(cat.slug)}
                role="tab"
                aria-selected={isActive}
              >
                <div className="help-cat-card__header">
                  <span className="help-cat-card__title">{cat.title}</span>
                  <span className="help-cat-card__count">{count}</span>
                </div>
                <p className="help-cat-card__blurb">{cat.blurb}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Input & Quick Keyword Tags */}
      <div className="help-search-panel">
        <div className="field">
          <label htmlFor="help-search" className="label" style={{ fontWeight: 600 }}>
            Search knowledge base
          </label>
          <div className="help-search-input-wrap">
            <input
              id="help-search"
              type="search"
              className="help-search-input"
              placeholder="e.g. refund, streak, python, QR code, reset password..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                type="button"
                className="help-search-clear"
                onClick={() => setQuery("")}
                aria-label="Clear search query"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        <div className="help-quick-tags" aria-label="Quick search tags">
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", fontFamily: "var(--font-outlier)" }}>
            Popular:
          </span>
          {POPULAR_KEYWORDS.map((k) => (
            <button
              key={k}
              type="button"
              className="help-quick-tag"
              onClick={() => setQuery(k)}
            >
              {k}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "var(--text-xs)", color: "var(--color-muted)", paddingTop: "var(--space-2xs)" }}>
          <span>
            Showing {filtered.length} of {articles.length} articles
            {selectedCategory !== "all" ? ` in ${categories.find((c) => c.slug === selectedCategory)?.title ?? selectedCategory}` : ""}
          </span>
          {(query || selectedCategory !== "all") && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSelectedCategory("all");
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--color-ink-2)",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Articles List / Grid */}
      {filtered.length === 0 ? (
        <div
          className="panel"
          style={{
            padding: "var(--space-2xl)",
            textAlign: "center",
            display: "grid",
            gap: "var(--space-sm)",
            placeItems: "center",
            background: "var(--color-paper-3)",
          }}
        >
          <h3>No articles found for &ldquo;{query}&rdquo;</h3>
          <p style={{ color: "var(--color-ink-2)", maxWidth: "50ch", margin: 0 }}>
            Try another keyword, clear active filters, or ask our AI Support Coach below.
          </p>
          <div style={{ display: "flex", gap: "var(--space-sm)", marginTop: "var(--space-xs)" }}>
            <button
              type="button"
              className="btn btn--quiet"
              onClick={() => {
                setQuery("");
                setSelectedCategory("all");
              }}
            >
              Reset search
            </button>
            <Link href="/contact" className="btn">
              Contact human support
            </Link>
          </div>
        </div>
      ) : (
        <ul className="help-index" aria-label="Documentation articles">
          {filtered.map((art) => {
            const catTitle = categories.find((c) => c.slug === art.category)?.title ?? art.category;
            return (
              <li key={art.slug} className="help-article-card">
                <Link href={`/help/${art.slug}`} className="help-article-card__link">
                  <div className="help-article-card__meta">
                    <span className="chip" style={{ fontSize: "var(--text-xs)", background: "var(--color-paper-2)" }}>
                      {catTitle}
                    </span>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", fontFamily: "var(--font-outlier)" }}>
                      2 min read
                    </span>
                  </div>

                  <div className="help-article-card__head">
                    <h4 className="help-article-card__title">{art.title}</h4>
                    <span className="help-article-card__arrow" aria-hidden="true">&rarr;</span>
                  </div>

                  <p className="help-article-card__summary">{art.summary}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
