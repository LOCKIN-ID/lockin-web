"use client";

import { useState } from "react";
import Link from "next/link";
import type { BookContent } from "@/content/types";
import { priceLabel } from "@/lib/format";

export interface BookSampleSnippet {
  lang: string;
  code: string;
  caption: string;
  runtime: string;
}

interface BookManualCardProps {
  book: BookContent;
  coverSrc: string;
  tierNumber: string;
  topics: string[];
  snippet: BookSampleSnippet;
}

type TabKey = "overview" | "syllabus" | "snippet";

export function BookManualCard({
  book,
  coverSrc,
  tierNumber,
  topics,
  snippet,
}: BookManualCardProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const free = (book.priceIdr ?? 0) === 0;
  const sectionCount = book.chapters.reduce((n, ch) => n + ch.sections.length, 0);
  const totalMinutes = book.chapters.reduce((sum, ch) => sum + ch.minutes, 0);

  return (
    <article className="book-card" data-reveal="plate" data-tier={book.tier}>
      <div className="book-card__main-grid">
        {/* Left: Tactile 3D Manual */}
        <div className="book-card__manual-col">
          <div className="book-manual">
            <div className="book-manual__spine" aria-hidden="true">
              <span className="book-manual__spine-text">
                {tierNumber} • LOCK.IN
              </span>
              <div className="book-manual__spine-stitches" />
            </div>

            <div className="book-manual__cover-wrap">
              <img
                src={coverSrc}
                alt={`${book.title} cover`}
                className="book-manual__cover-img"
              />
              <div className="book-manual__glare" aria-hidden="true" />
              <div className="book-manual__pages-edge" aria-hidden="true" />

              <div className="book-manual__badge-bar">
                <span className="book-manual__tier-badge">{tierNumber}</span>
                <span className="book-manual__pages-badge">
                  {book.pageCount}P MANUAL
                </span>
              </div>
            </div>
          </div>

          <div className="book-card__manual-specs">
            <span className="book-card__spec-pill">
              <strong>{book.chapters.length}</strong> Bab
            </span>
            <span className="book-card__spec-pill">
              <strong>{totalMinutes}</strong> Mnt
            </span>
            <span className="book-card__spec-pill">
              <strong>{book.quests.length}</strong> Quest
            </span>
          </div>
        </div>

        {/* Center: Details & Tabbed Inspector (Height-locked) */}
        <div className="book-card__details-col">
          <div className="book-card__header-strip">
            <div className="book-card__tier-identity">
              <span className="chip chip--tier">
                {tierNumber}: {book.levelLabel}
              </span>
              <span className={`chip ${free ? "chip--free" : "chip--access"}`}>
                {free ? "Open Edition" : "Lifetime Access"}
              </span>
            </div>
            <span className="book-card__runtime-tag">
              {snippet.runtime}
            </span>
          </div>

          <h2 className="book-card__title">
            <Link href={`/books/${book.slug}`}>{book.title}</Link>
          </h2>

          <p className="book-card__promise">{book.promise}</p>

          {/* Interactive Inspector Tabs */}
          <div className="book-card__inspector">
            <div
              className="book-card__tablist"
              role="tablist"
              aria-label={`Spesifikasi dan silabus ${book.title}`}
            >
              <button
                type="button"
                role="tab"
                id={`tab-overview-${book.slug}`}
                aria-selected={activeTab === "overview"}
                aria-controls={`panel-overview-${book.slug}`}
                className={`book-card__tab ${activeTab === "overview" ? "is-active" : ""}`}
                onClick={() => setActiveTab("overview")}
              >
                Materi Inti
              </button>
              <button
                type="button"
                role="tab"
                id={`tab-syllabus-${book.slug}`}
                aria-selected={activeTab === "syllabus"}
                aria-controls={`panel-syllabus-${book.slug}`}
                className={`book-card__tab ${activeTab === "syllabus" ? "is-active" : ""}`}
                onClick={() => setActiveTab("syllabus")}
              >
                Silabus ({book.chapters.length} Bab)
              </button>
              <button
                type="button"
                role="tab"
                id={`tab-snippet-${book.slug}`}
                aria-selected={activeTab === "snippet"}
                aria-controls={`panel-snippet-${book.slug}`}
                className={`book-card__tab ${activeTab === "snippet" ? "is-active" : ""}`}
                onClick={() => setActiveTab("snippet")}
              >
                Cuplikan Kode
              </button>
            </div>

            {/* Locked height container: prevents layout jump when switching tabs */}
            <div className="book-card__panel-container">
              {/* Tab 1: Overview & Topics */}
              {activeTab === "overview" && (
                <div
                  id={`panel-overview-${book.slug}`}
                  role="tabpanel"
                  aria-labelledby={`tab-overview-${book.slug}`}
                  className="book-card__panel"
                >
                  <div className="book-card__topic-list">
                    {topics.map((t) => (
                      <span key={t} className="book-card__topic-tag">
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="book-card__quick-stats">
                    <div className="book-card__quick-stat-item">
                      <span className="book-card__stat-bullet" aria-hidden="true" />
                      <span><strong>Target:</strong> {book.promise}</span>
                    </div>
                    <div className="book-card__quick-stat-item">
                      <span className="book-card__stat-bullet" aria-hidden="true" />
                      <span><strong>Densitas:</strong> {book.pageCount} halaman • {sectionCount} sub-bab • {book.quests.length} Quest QR</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Syllabus Breakdown (Compact 2-Column Grid) */}
              {activeTab === "syllabus" && (
                <div
                  id={`panel-syllabus-${book.slug}`}
                  role="tabpanel"
                  aria-labelledby={`tab-syllabus-${book.slug}`}
                  className="book-card__panel"
                >
                  <div className="book-card__syllabus-grid">
                    {book.chapters.map((ch, idx) => (
                      <div key={ch.id} className="book-card__syllabus-cell">
                        <span className="book-card__chapter-num">0{idx + 1}</span>
                        <span className="book-card__chapter-name" title={ch.title}>
                          {ch.title}
                        </span>
                        <span className="book-card__chapter-dur">{ch.minutes}m</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Runnable Code Preview */}
              {activeTab === "snippet" && (
                <div
                  id={`panel-snippet-${book.slug}`}
                  role="tabpanel"
                  aria-labelledby={`tab-snippet-${book.slug}`}
                  className="book-card__panel"
                >
                  <div className="book-card__snippet-box">
                    <div className="book-card__snippet-bar">
                      <span className="book-card__snippet-title">
                        {snippet.runtime}
                      </span>
                      <span className="book-card__snippet-lang">
                        .{snippet.lang}
                      </span>
                    </div>

                    <pre className="book-card__snippet-pre">
                      <code>{snippet.code}</code>
                    </pre>

                    <div className="book-card__snippet-footer">
                      <span>{snippet.caption}</span>
                      <Link
                        href={free ? `/app/books/${book.slug}` : `/books/${book.slug}`}
                        className="book-card__snippet-action"
                      >
                        Jalankan di reader →
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Action & Access Dock */}
        <div className="book-card__dock-col">
          <div className="book-card__price-deck">
            <span className="book-card__price-status">
              {free ? "Open Edition" : "Lisensi Selamanya"}
            </span>
            <div className="book-card__price-amount">
              {free ? "Gratis" : priceLabel(book.priceIdr ?? 0)}
            </div>
            <span className="book-card__price-subtext">
              {free ? "Akses instan di browser" : "Termasuk PDF print & reader"}
            </span>
          </div>

          <div className="book-card__dock-actions">
            <Link
              href={free ? `/app/books/${book.slug}` : `/books/${book.slug}#buy`}
              className="btn btn--primary-mint btn-sweep-diagonal"
            >
              <span>{free ? "Mulai Baca Sekarang" : "Beli E-Book & Akses"}</span>
              <span className="btn-arrow" aria-hidden="true">→</span>
            </Link>

            <Link
              href={`/books/${book.slug}`}
              className="btn btn--outline-paper btn-sweep-vertical"
            >
              <span>Lihat Silabus Lengkap</span>
              <span className="btn-arrow" aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
