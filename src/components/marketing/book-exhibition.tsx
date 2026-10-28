"use client";

import { useState } from "react";
import Link from "next/link";
import type { BookContent } from "@/content/types";
import { priceLabel } from "@/lib/format";

interface Props {
  books: BookContent[];
}

export function BookExhibition({ books }: Props) {
  const [activeSlug, setActiveSlug] = useState<string>(books[0]?.slug ?? "beginner");
  const activeIndex = books.findIndex((b) => b.slug === activeSlug);

  return (
    <div
      data-reveal="plate"
      style={{
        marginTop: "var(--space-2xl)",
        background: "var(--color-paper-3)",
        border: "1px solid var(--color-rule)",
        borderRadius: "var(--radius-card)",
        padding: "var(--space-2xl) var(--space-xl)",
        boxShadow: "var(--shadow-raised)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "var(--space-2xl)",
          alignItems: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Left Stage: 3D Overlapping Perspective Book Fan */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "360px",
            perspective: "1200px",
            padding: "var(--space-lg) 0",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "240px",
              height: "340px",
            }}
          >
            {books.map((book, idx) => {
              const isSelected = book.slug === activeSlug;
              // 3D smooth perspective fan offsets
              const offset = idx - activeIndex;
              const translateX = offset * 56;
              const translateY = Math.abs(offset) * 14;
              const rotateY = offset * -15;
              const rotateZ = offset * 3.5;
              const scale = isSelected ? 1.06 : 0.92;
              const zIndex = isSelected ? 20 : 10 - Math.abs(offset);

              return (
                <div
                  key={book.slug}
                  onClick={() => setActiveSlug(book.slug)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setActiveSlug(book.slug);
                    }
                  }}
                  aria-label={`Pilih ${book.title}`}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "240px",
                    height: "340px",
                    borderRadius: "10px",
                    overflow: "hidden",
                    cursor: "pointer",
                    transform: `translateX(${translateX}px) translateY(${translateY}px) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`,
                    transformOrigin: "bottom center",
                    zIndex,
                    transition:
                      "transform 550ms cubic-bezier(0.34, 1.25, 0.64, 1), box-shadow 550ms ease, opacity 400ms ease, filter 400ms ease",
                    border: isSelected ? "2px solid var(--color-forest)" : "1px solid var(--color-rule)",
                    boxShadow: isSelected
                      ? "0 20px 42px rgba(18, 56, 32, 0.22), 0 4px 12px rgba(0,0,0,0.08)"
                      : "0 8px 18px rgba(0, 0, 0, 0.12)",
                    filter: isSelected ? "none" : "brightness(0.9) contrast(0.95)",
                    opacity: isSelected ? 1 : 0.72,
                  }}
                >
                  <img
                    src="/ebooks/cover-lockin.png"
                    alt={book.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />

                  {/* Spine Crease Shading */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(90deg, rgba(0,0,0,0.35) 0%, rgba(255,255,255,0.15) 3%, transparent 8%, transparent 94%, rgba(0,0,0,0.4) 100%)",
                      pointerEvents: "none",
                    }}
                  />

                  {/* Spine Bottom Overlay Tag */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: "var(--space-md)",
                      background: "linear-gradient(to top, rgba(15, 40, 30, 0.95) 0%, transparent 100%)",
                      color: "var(--color-paper)",
                      display: "grid",
                      gap: "2px",
                    }}
                  >
                    <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.85 }}>
                      Modul 0{idx + 1}
                    </span>
                    <span style={{ fontWeight: 800, fontSize: "var(--text-sm)", lineHeight: 1.2 }}>
                      {book.title.split(":")[0]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Stage: Interactive Dossier & Flight Deck with Stable Container Dimensions */}
        <div style={{ display: "grid", gap: "var(--space-lg)" }}>
          {/* Module Selector Pills */}
          <div style={{ display: "flex", gap: "var(--space-xs)", flexWrap: "wrap", alignItems: "center" }}>
            {books.map((b, i) => {
              const active = b.slug === activeSlug;
              return (
                <button
                  key={b.slug}
                  type="button"
                  onClick={() => setActiveSlug(b.slug)}
                  className="chip"
                  style={{
                    cursor: "pointer",
                    background: active ? "var(--color-forest)" : "var(--color-paper-2)",
                    color: active ? "var(--color-paper)" : "var(--color-ink-2)",
                    borderColor: active ? "var(--color-forest)" : "var(--color-rule)",
                    fontWeight: active ? 700 : 500,
                    padding: "6px 14px",
                    fontSize: "var(--text-xs)",
                    transition: "background-color 250ms ease, color 250ms ease, border-color 250ms ease",
                  }}
                >
                  Modul 0{i + 1} · {b.levelLabel}
                </button>
              );
            })}
          </div>

          {/* Locked Grid Area: All books occupy the exact same slot, container never resizes! */}
          <div style={{ display: "grid", gridTemplateAreas: "'dossier'", minHeight: "340px" }}>
            {books.map((b, i) => {
              const isSelected = b.slug === activeSlug;
              const isFree = b.priceIdr === 0;

              return (
                <div
                  key={b.slug}
                  style={{
                    gridArea: "dossier",
                    display: "grid",
                    gap: "var(--space-lg)",
                    opacity: isSelected ? 1 : 0,
                    transform: isSelected ? "translateY(0)" : "translateY(10px)",
                    pointerEvents: isSelected ? "auto" : "none",
                    visibility: isSelected ? "visible" : "hidden",
                    transition:
                      "opacity 450ms cubic-bezier(0.16, 1, 0.3, 1), transform 450ms cubic-bezier(0.16, 1, 0.3, 1), visibility 450ms",
                  }}
                >
                  <div style={{ display: "grid", gap: "var(--space-xs)" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-outlier)",
                        fontSize: "var(--text-xs)",
                        letterSpacing: "0.12em",
                        color: "var(--color-forest)",
                        fontWeight: 800,
                        textTransform: "uppercase",
                      }}
                    >
                      MODUL 0{i + 1} · {b.levelLabel} TIER
                    </span>

                    <h3 style={{ fontSize: "var(--text-2xl)", margin: 0, fontWeight: 900 }}>
                      {b.title}
                    </h3>

                    <p style={{ color: "var(--color-ink-2)", fontSize: "var(--text-md)", lineHeight: 1.5, margin: 0 }}>
                      {b.promise}
                    </p>
                  </div>

                  {/* Chapter Outline Strip */}
                  <div
                    style={{
                      padding: "var(--space-md)",
                      background: "var(--color-paper-2)",
                      borderRadius: "var(--radius-card)",
                      border: "1px solid var(--color-rule)",
                      display: "grid",
                      gap: "var(--space-xs)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--color-muted)",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Rangkaian Bab Pembelajaran ({b.chapters.length} Bab)
                    </span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2xs)" }}>
                      {b.chapters.map((ch, idx) => (
                        <span
                          key={ch.id}
                          style={{
                            fontSize: "var(--text-xs)",
                            background: "var(--color-paper-3)",
                            border: "1px solid var(--color-rule)",
                            borderRadius: "4px",
                            padding: "3px 8px",
                            color: "var(--color-ink)",
                          }}
                        >
                          <strong style={{ color: "var(--color-forest)" }}>0{idx + 1}.</strong> {ch.title}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Telemetry Bar & Action */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "var(--space-md)",
                      borderTop: "1px dashed var(--color-rule)",
                      paddingTop: "var(--space-md)",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-xs)" }}>
                        <span
                          className="num"
                          style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "var(--text-3xl)",
                            fontWeight: 900,
                            color: "var(--color-forest)",
                          }}
                        >
                          {isFree ? "Gratis" : priceLabel(b.priceIdr ?? 0)}
                        </span>
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
                          / {b.pageCount} Halaman Padat
                        </span>
                      </div>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", marginTop: "2px" }}>
                        {b.chapters.length} Checkpoints · {b.quests.length} Kode QR Cetak
                      </div>
                    </div>

                    <Link
                      href={`/books/${b.slug}`}
                      className="btn"
                      style={{ minWidth: "160px", justifyContent: "center" }}
                    >
                      {isFree ? "Buka Preview Gratis" : "Buka Modul E-Book"}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
