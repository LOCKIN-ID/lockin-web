"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Topography } from "@/components/brand/topography";
import { BookExhibition } from "@/components/marketing/book-exhibition";
import { TornPaperEdge } from "@/components/brand/torn-paper";
import type { BookContent } from "@/content/types";
import { priceLabel } from "@/lib/format";
import { PLANS } from "@/content/plans";

interface ScrollStorylineProps {
  books: BookContent[];
  firstQuest: {
    slug: string;
    code: string;
    title: string;
    xp: number;
  };
  facts: {
    code: number;
    runnable: number;
  };
}

interface TerminalLine {
  text: string;
  type: "cmd" | "log" | "pass" | "award";
}

interface CrtScenario {
  id: string;
  tag: string;
  fileTitle: string;
  lines: TerminalLine[];
}

const CRT_SCENARIOS: CrtScenario[] = [
  {
    id: "js",
    tag: "RUN // JAVASCRIPT ES6+",
    fileTitle: "test-store.ts",
    lines: [
      { type: "cmd", text: "node test-store.ts" },
      { type: "log", text: "> const store = createStore({ state: 'active' });" },
      { type: "log", text: "> store.dispatch({ type: 'SYNC_DOM' });" },
      { type: "pass", text: "[PASS] State reactive: DOM updated in 0.4ms." },
      { type: "award", text: "[AWARD] +15 XP berhasil ditambahkan ke profil!" },
    ],
  },
  {
    id: "python",
    tag: "RUN // PYTHON 3 PYODIDE",
    fileTitle: "test_matrix.py",
    lines: [
      { type: "cmd", text: "python3 test_matrix.py" },
      { type: "log", text: ">>> from solution import solve_matrix" },
      { type: "log", text: ">>> solve_matrix([[1, 0], [0, 1]])" },
      { type: "pass", text: "[PASS] 3/3 test cases passed in 12ms." },
      { type: "award", text: "[AWARD] +20 XP berhasil ditambahkan ke profil!" },
    ],
  },
  {
    id: "shell",
    tag: "RUN // LINUX BUSYBOX WASM",
    fileTitle: "pipeline.sh",
    lines: [
      { type: "cmd", text: "busybox sh pipeline.sh" },
      { type: "log", text: "$ crond -f -l 8 &" },
      { type: "log", text: "$ ./pipeline.sh --validate" },
      { type: "pass", text: "[PASS] Pipeline completed with exit code 0." },
      { type: "award", text: "[AWARD] +25 XP berhasil ditambahkan ke profil!" },
    ],
  },
];

export function ScrollStoryline({
  books,
  firstQuest,
  facts,
}: ScrollStorylineProps) {
  const [scrollY, setScrollY] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [activeCrtIndex, setActiveCrtIndex] = useState(0);
  const [typedLines, setTypedLines] = useState<TerminalLine[]>([]);
  const storyRef = useRef<HTMLDivElement>(null);

  // Progressive streaming animation across all lines
  useEffect(() => {
    const scenario = CRT_SCENARIOS[activeCrtIndex];
    setTypedLines([]);

    let lineIdx = 0;
    let charIdx = 0;
    let currentCmd = "";

    const timer = setInterval(() => {
      const targetLine = scenario.lines[lineIdx];
      if (!targetLine) {
        clearInterval(timer);
        return;
      }

      if (targetLine.type === "cmd") {
        if (charIdx < targetLine.text.length) {
          currentCmd += targetLine.text[charIdx];
          charIdx++;
          setTypedLines([{ type: "cmd", text: currentCmd }]);
        } else {
          lineIdx++;
          charIdx = 0;
        }
      } else {
        lineIdx++;
        setTypedLines((prev) => [...prev, targetLine]);
      }
    }, 42);

    return () => clearInterval(timer);
  }, [activeCrtIndex]);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setReducedMotion(true);
      return;
    }

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Parallax offsets (disabled under reduced motion)
  const p1 = reducedMotion ? 0 : Math.round(scrollY * 0.06);
  const p2 = reducedMotion ? 0 : Math.round(scrollY * -0.04);
  const p3 = reducedMotion ? 0 : Math.round(scrollY * 0.08);

  return (
    <div ref={storyRef} className="storyline">
      {/* ===================================================================
          CHAPTER 01: The Paradigm Shift (Background morphs to Forest Deep)
          =================================================================== */}
      <section
        id="shift"
        className="story-act story-act--dark"
        style={{
          position: "relative",
          background: "var(--color-forest-deep)",
          color: "var(--color-paper)",
          paddingBlock: "var(--space-4xl)",
          overflow: "hidden",
          transition: "background-color var(--dur-long) var(--ease-out)",
        }}
      >
        {/* Subtle dark contour elevation background */}
        <Topography variant="dark" />

        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          {/* Header Row (Image #2) */}
          <div className="method-header" data-reveal="up">
            <div className="method-header__left">
              <span className="method-header__tag">PENDEKATAN KAMI</span>
              <h2 className="method-header__title">METODE.</h2>
            </div>
            <p className="method-header__desc">
              Tiga pilar pembelajaran mandiri untuk mencapai penguasaan konsep yang mendalam.
            </p>
          </div>

          {/* Horizontal Stacked Rows (Pure CSS Hover) */}
          <div className="method-list" data-reveal="plate">
            {/* Row 01 */}
            <div className="method-row">
              <span className="method-row__num">01</span>
              <h3 className="method-row__title">10–15 Halaman</h3>
              <div className="method-row__icon">
                <svg width="68" height="48" viewBox="0 0 72 52" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="6" y="6" width="60" height="40" rx="3" />
                  <line x1="36" y1="6" x2="36" y2="46" />
                  <line x1="14" y1="16" x2="28" y2="16" />
                  <line x1="14" y1="24" x2="28" y2="24" />
                  <line x1="14" y1="32" x2="24" y2="32" />
                  <line x1="44" y1="16" x2="58" y2="16" />
                  <line x1="44" y1="24" x2="58" y2="24" />
                  <line x1="44" y1="32" x2="54" y2="32" />
                </svg>
              </div>
              <p className="method-row__desc">
                Materi padat yang tuntas dipelajari dalam satu sesi fokus tanpa distraksi teori berlebih.
              </p>
              <span className="method-row__arrow">↗</span>
            </div>

            {/* Row 02 */}
            <div className="method-row">
              <span className="method-row__num">02</span>
              <h3 className="method-row__title">Praktik Langsung</h3>
              <div className="method-row__icon">
                <svg width="68" height="48" viewBox="0 0 72 52" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="6" y="6" width="60" height="40" rx="3" />
                  <line x1="6" y1="16" x2="66" y2="16" />
                  <circle cx="14" cy="11" r="1.5" fill="currentColor" />
                  <circle cx="20" cy="11" r="1.5" fill="currentColor" />
                  <circle cx="26" cy="11" r="1.5" fill="currentColor" />
                  <path d="M16 28 L24 34 L16 40" stroke="currentColor" />
                  <line x1="28" y1="40" x2="38" y2="40" stroke="currentColor" />
                </svg>
              </div>
              <p className="method-row__desc">
                Langsung diuji di lingkungan interaktif dan latihan mandiri tanpa perlu instalasi perangkat lunak rumit.
              </p>
              <span className="method-row__arrow">↗</span>
            </div>

            {/* Row 03 */}
            <div className="method-row">
              <span className="method-row__num">03</span>
              <h3 className="method-row__title">Bimbingan Socratic</h3>
              <div className="method-row__icon">
                <svg width="68" height="48" viewBox="0 0 72 52" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 44 L22 18 C22 11 28 6 36 6 C44 6 50 11 50 18 L50 44" />
                  <path d="M22 24 L50 24" />
                  <path d="M22 34 L50 34" />
                  <circle cx="36" cy="15" r="3" fill="currentColor" />
                  <line x1="14" y1="44" x2="58" y2="44" />
                </svg>
              </div>
              <p className="method-row__desc">
                AI Coach mendiagnosis kebingungan pemahaman dan memberikan tangga petunjuk bertahap tanpa menyuapi jawaban jadi.
              </p>
              <span className="method-row__arrow">↗</span>
            </div>
          </div>
        </div>
      </section>
      {/* Torn paper transition: Section 1 (Dark) to Section 2 (Paper) */}
      <TornPaperEdge variant="dark-to-paper" index={1} />


      {/* ===================================================================
          CHAPTER 02: The Progression (Curated 3D Manual Exhibition)
          =================================================================== */}
      <section
        id="curriculum"
        className="story-act"
        style={{
          position: "relative",
          background: "var(--color-paper)",
          color: "var(--color-ink)",
          paddingBlock: "var(--space-4xl)",
          overflow: "hidden",
          transition: "background-color var(--dur-long) var(--ease-out)",
        }}
      >
        {/* Soft topography lines in light paper */}
        <Topography variant="paper" />

        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div className="story-act__head" data-reveal="up" style={{ textAlign: "center", maxWidth: "64ch", margin: "0 auto var(--space-2xl)" }}>
            <h2 style={{ fontSize: "var(--text-display-s)", lineHeight: 1.15, marginTop: "var(--space-sm)" }}>
              Tiga modul terkurasi.{" "}
              <span className="highlight-mint">Progresi nyata.</span>
            </h2>
          </div>

          {/* Interactive 3D Book Shelf */}
          <BookExhibition books={books} />
        </div>
      </section>
      {/* Torn paper transition: Section 2 (Paper) to Section 3 (Dark) */}
      <TornPaperEdge variant="paper-to-dark" index={2} />


      {/* ===================================================================
          CHAPTER 03: The Artifact (Physical Book meets Digital Sandbox)
          =================================================================== */}
      <section
        id="bridge"
        className="story-act story-act--dark"
        style={{
          position: "relative",
          background: "var(--color-forest-deep)",
          color: "var(--color-paper)",
          paddingBlock: "var(--space-4xl)",
          overflow: "hidden",
        }}
      >
        <Topography variant="dark" />

        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div className="story-act__head" data-reveal="up" style={{ textAlign: "center", maxWidth: "66ch", margin: "0 auto var(--space-2xl)" }}>
            <h2 style={{ fontSize: "var(--text-display-s)", lineHeight: 1.15, marginTop: "var(--space-sm)", color: "var(--color-paper)" }}>
              Baca di buku.{" "}
              <span className="highlight-mint">Praktik di layar.</span>
            </h2>
          </div>

          {/* CRT Terminal Video-Player Screen (Image #1 style) */}
          <div className="crt-workbench-wrap" data-reveal="plate">
            {/* Main Screen Frame */}
            <div className="crt-screen-frame">
              {/* Screen Top Bar Inside Frame (NO CH 01, NO NEON) */}
              <div className="crt-screen-top-bar">
                <span className="crt-screen-tag">
                  {CRT_SCENARIOS[activeCrtIndex].tag}
                </span>
              </div>

              {/* CRT Canvas with Typing Shell */}
              <div className="crt-screen-canvas">
                {/* Fixed-Height Terminal Box (Zero Layout Shift) */}
                <div className="crt-terminal-box">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid rgba(241,241,235,0.1)", paddingBottom: "10px" }}>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#E06C75" }} />
                      <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#E5C07B" }} />
                      <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#98C379" }} />
                      <span style={{ marginLeft: "10px", fontFamily: "var(--font-code)", fontSize: "0.72rem", color: "#A3B899" }}>
                        {CRT_SCENARIOS[activeCrtIndex].fileTitle}
                      </span>
                    </div>
                    <span style={{ fontFamily: "var(--font-code)", fontSize: "0.7rem", color: "#A3B899" }}>CLIENT-SIDE RUNTIME</span>
                  </div>

                  {/* Terminal Streaming Output */}
                  <div style={{ fontFamily: "var(--font-code)", fontSize: "0.92rem", lineHeight: 1.65, color: "#FAF9F5", flex: 1, overflowY: "auto" }}>
                    {typedLines.map((line, lIdx) => {
                      if (line.type === "cmd") {
                        return (
                          <div key={lIdx}>
                            <span style={{ color: "#98B59D", fontWeight: 700 }}>developer@lockin</span>:<span style={{ color: "#C5D2C0" }}>~/project</span>$ {line.text}
                            <span style={{ display: "inline-block", width: "8px", height: "15px", background: "#FAF9F5", verticalAlign: "middle", marginLeft: "4px" }} />
                          </div>
                        );
                      }
                      if (line.type === "log") {
                        return (
                          <div key={lIdx} style={{ color: "#C5D2C0", marginTop: "4px" }}>
                            {line.text}
                          </div>
                        );
                      }
                      if (line.type === "pass") {
                        return (
                          <div key={lIdx} style={{ marginTop: "8px", padding: "8px 12px", background: "rgba(241, 241, 235, 0.08)", borderLeft: "3px solid #FAF9F5", borderRadius: "4px" }}>
                            <span style={{ color: "#FAF9F5", fontWeight: "bold" }}>{line.text}</span>
                          </div>
                        );
                      }
                      if (line.type === "award") {
                        return (
                          <div key={lIdx} style={{ color: "#C5D2C0", fontSize: "0.85rem", marginTop: "4px", paddingLeft: "12px" }}>
                            {line.text}
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Control Bar (Image #1 style) */}
            <div className="crt-controls-bar">
              <div className="crt-pagination">
                <button
                  type="button"
                  className="crt-page-btn"
                  onClick={() => setActiveCrtIndex((prev) => (prev > 0 ? prev - 1 : CRT_SCENARIOS.length - 1))}
                  aria-label="Previous scenario"
                >
                  ←
                </button>
                {CRT_SCENARIOS.map((sc, scIdx) => (
                  <button
                    key={sc.id}
                    type="button"
                    className={`crt-page-btn ${activeCrtIndex === scIdx ? "is-active" : ""}`}
                    onClick={() => setActiveCrtIndex(scIdx)}
                  >
                    0{scIdx + 1}
                  </button>
                ))}
                <button
                  type="button"
                  className="crt-page-btn"
                  onClick={() => setActiveCrtIndex((prev) => (prev < CRT_SCENARIOS.length - 1 ? prev + 1 : 0))}
                  aria-label="Next scenario"
                >
                  →
                </button>
              </div>

              <div className="crt-caption">
                Eksekusi langsung di peramban tanpa instalasi lokal
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Torn paper transition: Section 3 (Dark) to Section 4 (Paper) */}
      <TornPaperEdge variant="dark-to-paper" index={3} />

      {/* ===================================================================
          CHAPTER 04: The Finale & Transparent Gateway
          =================================================================== */}
      <section
        id="gateway"
        className="story-act"
        style={{
          position: "relative",
          background: "var(--color-paper)",
          color: "var(--color-ink)",
          paddingBlock: "var(--space-4xl)",
          overflow: "hidden",
        }}
      >
        <Topography variant="paper" />

        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div className="story-act__head" data-reveal="up" style={{ textAlign: "center", maxWidth: "60ch", margin: "0 auto var(--space-2xl)" }}>
            <h2 style={{ fontSize: "var(--text-display-s)", lineHeight: 1.15, marginTop: "var(--space-sm)" }}>
              Pilihan akses.{" "}
              <span className="highlight-mint">Mulai gratis.</span>
            </h2>
          </div>

          {/* Snowhouse Connected Pricing Table (3 Columns, Web Palette, Zero Icons/Emots) */}
          <div className="snowhouse-table" data-reveal="plate">
            {/* Col 1: Starter / Free */}
            <div className="snowhouse-col">
              <div>
                <div className="snowhouse-col__strip snowhouse-col__strip--starter">
                  <span className="snowhouse-col__strip-title">Starter</span>
                </div>
                <div className="snowhouse-col__body">
                  <div className="snowhouse-col__price-block">
                    <span className="snowhouse-col__price">Rp 0</span>
                    <span className="snowhouse-col__period"> / selamanya</span>
                  </div>
                  <p className="snowhouse-col__desc">
                    Akses modul pengantar 10–15 halaman, panduan interaktif, dan 10 sesi bantuan AI harian.
                  </p>
                  <ul className="snowhouse-col__list">
                    <li>Modul 01 Lengkap</li>
                    <li>Panduan Interaktif</li>
                    <li>10 Sesi AI harian</li>
                  </ul>
                </div>
              </div>
              <div className="snowhouse-col__bottom">
                <Link
                  href="/books?tier=beginner"
                  className="btn btn--outline-paper btn-sweep-vertical"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  <span>Mulai Gratis</span>
                  <span className="btn-arrow" aria-hidden="true">→</span>
                </Link>
              </div>
            </div>

            {/* Col 2: Bundle 3 Buku (Featured) */}
            <div className="snowhouse-col">
              <div className="snowhouse-col__floating-badge">
                LISENSI SEUMUR HIDUP
              </div>
              <div>
                <div className="snowhouse-col__strip snowhouse-col__strip--bundle">
                  <span className="snowhouse-col__strip-title">Bundle 3 Buku</span>
                </div>
                <div className="snowhouse-col__body">
                  <div className="snowhouse-col__price-block">
                    <span className="snowhouse-col__price">Rp 20.000</span>
                    <span className="snowhouse-col__strikethrough">Rp 45.000</span>
                  </div>
                  <p className="snowhouse-col__desc">
                    Akses seluruh 3 seri buku (10–15 halaman per buku). Hak milik permanen tanpa langganan.
                  </p>
                  <ul className="snowhouse-col__list">
                    <li>3 E-Book Full PDF + EPub</li>
                    <li>Seluruh Checkpoint Latihan</li>
                    <li>Hak Milik Permanen</li>
                  </ul>
                </div>
              </div>
              <div className="snowhouse-col__bottom">
                <Link
                  href="/pricing"
                  className="btn btn--bundle btn-sweep-diagonal"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  <span>Beli Paket Bundle</span>
                  <span className="btn-arrow" aria-hidden="true">→</span>
                </Link>
              </div>
            </div>

            {/* Col 3: Web Pro */}
            <div className="snowhouse-col">
              <div>
                <div className="snowhouse-col__strip snowhouse-col__strip--pro">
                  <span className="snowhouse-col__strip-title">Web Pro</span>
                </div>
                <div className="snowhouse-col__body">
                  <div className="snowhouse-col__price-block">
                    <span className="snowhouse-col__price">Rp 49.000</span>
                    <span className="snowhouse-col__period"> / akun</span>
                  </div>
                  <p className="snowhouse-col__desc">
                    Akses tak terbatas ke Socratic AI tutor, semua materi buku baru, dan panduan lanjutan.
                  </p>
                  <ul className="snowhouse-col__list">
                    <li>Semua Seri E-Book</li>
                    <li>Unlimited Socratic AI</li>
                    <li>Akses Materi Baru</li>
                  </ul>
                </div>
              </div>
              <div className="snowhouse-col__bottom">
                <Link
                  href="/pricing"
                  className="btn btn--pro btn-sweep-horizontal"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  <span>Langganan Pro</span>
                  <span className="btn-arrow" aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "var(--space-xl)", textAlign: "center" }}>
            <Link href="/books" className="btn btn--catalogue-cta btn-sweep-diagonal">
              <span>Lihat Seluruh Katalog E-Book ({books.length} Buku)</span>
              <span className="btn-arrow" aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
