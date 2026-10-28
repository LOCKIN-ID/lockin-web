"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import type { HelpArticleSeed, HelpCategory } from "@/content/help";

interface Props {
  articles: HelpArticleSeed[];
  categories: HelpCategory[];
}

/**
 * The hub index: a search field, the category filter, and one row per article.
 *
 * A row is a single link: category chip and title: because the summary is
 * already written in full on the article page, and nine summaries on one screen
 * is more words than a screen holds. The whole row is the hit target.
 */
export function HelpSearchList({ articles, categories }: Props) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

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

  return (
    <div style={{ display: "grid", gap: "var(--space-xl)" }}>
      {/* Search Input & Category Filter */}
      <div style={{ display: "grid", gap: "var(--space-md)" }}>
        <div className="field">
          <label htmlFor="help-search" className="label">
            Search articles
          </label>
          <input
            id="help-search"
            type="search"
            className="input"
            placeholder="e.g. refund, streak, python, QR code, reset password..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="rail" role="tablist" aria-label="Filter by category">
          <button
            type="button"
            className="chip"
            onClick={() => setSelectedCategory("all")}
            aria-current={selectedCategory === "all" ? "page" : undefined}
          >
            All Categories ({articles.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              className="chip"
              onClick={() => setSelectedCategory(cat.slug)}
              aria-current={selectedCategory === cat.slug ? "page" : undefined}
            >
              {cat.title}
            </button>
          ))}
        </div>
      </div>

      {/* Articles: one row, one link */}
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
          <p style={{ color: "var(--color-ink-2)", maxWidth: "50ch" }}>
            Try another keyword, or ask the coach below.
          </p>
          <Link href="/contact" className="btn">
            Contact support
          </Link>
        </div>
      ) : (
        <ul className="help-index">
          {filtered.map((art) => (
            <li key={art.slug} className="panel panel--interactive help-index__row">
              <Link href={`/help/${art.slug}`} className="help-index__link">
                <span className="chip" style={{ fontSize: "var(--text-xs)", flexShrink: 0 }}>
                  {categories.find((c) => c.slug === art.category)?.title ?? art.category}
                </span>
                <span className="help-index__title">{art.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
