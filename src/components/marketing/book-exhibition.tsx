"use client";

import { useState } from "react";
import Link from "next/link";
import type { BookContent } from "@/content/types";
import { priceLabel } from "@/lib/format";

interface Props {
  books: BookContent[];
}

const EXPANDED_DESCRIPTIONS: Record<string, string> = {
  beginner:
    "Kuasai fondasi esensial web dan struktur logika dokumen secara tuntas. Didesain untuk pemula yang ingin memahami cara peramban merender teks, tata letak, dan interaksi tanpa terjebak video tutorial panjang yang pasif.",
  intermediate:
    "Bangun aplikasi reaktif mandiri dengan event dispatch dan pengelolaan state modern. Pelajari arsitektur data asynchronous dan penanganan aliran data secara efisien dalam format modul padat yang langsung dapat dieksekusi.",
  expert:
    "Eksplorasi rekayasa sistem tingkat lanjut di lingkungan Linux BusyBox WASM dan Python. Kuasai otomasi tugas berkala, pemrosesan stream data, dan optimasi performa komputasi mandiri.",
};

export function BookExhibition({ books }: Props) {
  const [activeSlug, setActiveSlug] = useState<string>(books[0]?.slug ?? "beginner");
  const activeIndex = books.findIndex((b) => b.slug === activeSlug);

  return (
    <div
      data-reveal="plate"
      style={{
        marginTop: "var(--space-2xl)",
        background: "color-mix(in oklab, var(--color-forest) 18%, var(--color-paper))",
        color: "var(--color-ink)",
        border: "1.5px solid color-mix(in oklab, var(--color-forest) 25%, transparent)",
        borderRadius: "var(--radius-card)",
        padding: "var(--space-2xl) var(--space-xl)",
        boxShadow: "0 12px 36px rgba(18, 36, 23, 0.08)",
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
                    background: active ? "var(--color-forest-deep)" : "color-mix(in oklab, var(--color-forest) 8%, transparent)",
                    color: active ? "var(--color-paper)" : "var(--color-ink)",
                    border: active ? "none" : "1px solid color-mix(in oklab, var(--color-forest) 18%, transparent)",
                    fontWeight: active ? 800 : 600,
                    padding: "6px 14px",
                    fontSize: "var(--text-xs)",
                    borderRadius: "20px",
                    transition: "all 250ms ease",
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
                  <div style={{ display: "grid", gap: "var(--space-2xs)" }}>
                    <h2
                      style={{
                        fontSize: "clamp(2.2rem, 3.6vw, 3.2rem)",
                        color: "var(--color-ink)",
                        letterSpacing: "-0.03em",
                        fontFamily: "var(--font-display)",
                        textTransform: "uppercase",
                        lineHeight: 1,
                      }}
                    >
                      {b.levelLabel}
                    </h2>

                    <div
                      style={{
                        fontFamily: "var(--font-code)",
                        fontSize: "var(--text-2xs)",
                        fontWeight: 800,
                        letterSpacing: "0.1em",
                        color: "var(--color-forest)",
                      }}
                    >
                      MODUL 0{i + 1} · 10–15 HALAMAN PADAT
                    </div>

                    <p style={{ color: "var(--color-ink-2)", fontSize: "var(--text-sm)", lineHeight: 1.65, margin: 0, maxWidth: "52ch", fontWeight: 500 }}>
                      {EXPANDED_DESCRIPTIONS[b.slug] ?? b.promise}
                    </p>
                  </div>

                  {/* 2x2 Metric Table (Soft Sage Palette - Zero White) */}
                  <div
                    style={{
                      background: "rgba(18, 36, 23, 0.08)",
                      border: "1.5px solid rgba(18, 36, 23, 0.22)",
                      borderRadius: "10px",
                      overflow: "hidden",
                    }}
                  >
                    {/* Row 1 */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid rgba(18, 36, 23, 0.18)" }}>
                      <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "baseline", borderRight: "1px solid rgba(18, 36, 23, 0.18)" }}>
                        <span style={{ fontFamily: "var(--font-code)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", color: "#4B5E50", textTransform: "uppercase" }}>HALAMAN BUKU</span>
                        <span style={{ fontFamily: "var(--font-code)", fontSize: "1.45rem", fontWeight: 900, color: "var(--color-ink)" }}>10–15</span>
                      </div>
                      <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ fontFamily: "var(--font-code)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", color: "#4B5E50", textTransform: "uppercase" }}>CHECKPOINTS</span>
                        <span style={{ fontFamily: "var(--font-code)", fontSize: "1.45rem", fontWeight: 900, color: "var(--color-ink)" }}>{b.chapters.length}</span>
                      </div>
                    </div>

                    {/* Row 2 */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                      <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "baseline", borderRight: "1px solid rgba(18, 36, 23, 0.18)" }}>
                        <span style={{ fontFamily: "var(--font-code)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", color: "#4B5E50", textTransform: "uppercase" }}>QUEST QR CETAK</span>
                        <span style={{ fontFamily: "var(--font-code)", fontSize: "1.45rem", fontWeight: 900, color: "var(--color-ink)" }}>{b.quests.length}</span>
                      </div>
                      <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ fontFamily: "var(--font-code)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", color: "#4B5E50", textTransform: "uppercase" }}>AKSES LISENSI</span>
                        <span style={{ fontFamily: "var(--font-code)", fontSize: "1.45rem", fontWeight: 900, color: isFree ? "#007A48" : "var(--color-ink)" }}>
                          {isFree ? "GRATIS" : priceLabel(b.priceIdr ?? 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* CTA Action */}
                  <div>
                    <Link
                      href={`/books/${b.slug}`}
                      className="btn btn--pro btn-sweep-horizontal"
                      style={{ display: "inline-flex", minWidth: "200px", justifyContent: "center" }}
                    >
                      <span>Buka Modul Sekarang</span>
                      <span className="btn-arrow" aria-hidden="true">→</span>
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
