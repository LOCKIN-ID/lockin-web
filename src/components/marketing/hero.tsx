"use client";

import Link from "next/link";
import { BlobMark, LeafSprig, Spark } from "@/components/brand/shapes";
import { LockinLogoSvg } from "@/components/brand/logo";
import { LockinShowcase } from "@/components/marketing/lockin-showcase";

export function Hero() {
  return (
    <section className="hero relative overflow-x-clip">
      <div className="container hero__grid" data-reveal-group>
        {/* Left Side: Rich, engaging, impactful headline & value propositions */}
        <div className="hero__type" style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "var(--space-lg)" }}>
          {/* Main Logo & Headline Lockup */}
          <h1 data-reveal="left" className="flex flex-col items-start gap-1" style={{ margin: 0 }}>
            <span
              style={{
                fontSize: "var(--text-sm)",
                letterSpacing: "0.18em",
                color: "var(--color-mint-vivid)",
                fontWeight: 800,
                fontFamily: "var(--font-valorant), var(--font-display)",
                textTransform: "uppercase",
              }}
            >
              SHH... <span className="highlight-mint">GONNA</span>
            </span>
            <span style={{ display: "block", maxWidth: "460px", width: "100%" }}>
              <LockinLogoSvg height={76} className="w-full h-auto drop-shadow-sm" />
            </span>
            <span className="visually-hidden">Shh. Gonna lock in.</span>
          </h1>

          <p className="lead" data-reveal="left" style={{ margin: 0, color: "var(--color-ink-2)", lineHeight: 1.5 }}>
            Tinggalkan video tutorial 40 jam dan slide presentasi membosankan. Kuasai rekayasa web dan sistem lewat 20 halaman padat, eksekusi kode instan, dan bimbingan Socratic AI.
          </p>

          {/* Classy Telemetry Instrument Bar */}
          <div
            data-reveal="left"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "var(--space-xs)",
              padding: "var(--space-md) var(--space-lg)",
              background: "var(--color-paper-2)",
              borderRadius: "var(--radius-card)",
              border: "1px solid var(--color-rule)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div>
              <span style={{ fontFamily: "var(--font-outlier)", fontSize: "var(--text-lg)", fontWeight: 900, color: "var(--color-forest)", display: "block", lineHeight: 1.1 }}>
                20 Hlm
              </span>
              <span style={{ fontSize: "11px", color: "var(--color-ink-2)", fontWeight: 600 }}>
                Padat per Buku
              </span>
            </div>
            <div style={{ borderLeft: "1px solid var(--color-rule)", paddingLeft: "var(--space-md)" }}>
              <span style={{ fontFamily: "var(--font-outlier)", fontSize: "var(--text-lg)", fontWeight: 900, color: "var(--color-forest)", display: "block", lineHeight: 1.1 }}>
                4 WASM
              </span>
              <span style={{ fontSize: "11px", color: "var(--color-ink-2)", fontWeight: 600 }}>
                Runtime di Tab
              </span>
            </div>
            <div style={{ borderLeft: "1px solid var(--color-rule)", paddingLeft: "var(--space-md)" }}>
              <span style={{ fontFamily: "var(--font-outlier)", fontSize: "var(--text-lg)", fontWeight: 900, color: "var(--color-forest)", display: "block", lineHeight: 1.1 }}>
                L1-L4
              </span>
              <span style={{ fontSize: "11px", color: "var(--color-ink-2)", fontWeight: 600 }}>
                Socratic Mentor
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="hero__actions" data-reveal="left">
            <Link className="btn" href="/books">
              Jelajahi E-Book
            </Link>
            <Link className="btn btn--quiet" href="/roadmap">
              Lihat Roadmap
            </Link>
          </div>
        </div>

        {/* Right Side: Animated LOCK.IN Platform Ecosystem Showcase */}
        <div className="relative min-w-0" data-reveal="right">
          <div className="shapes" aria-hidden="true">
            <Spark size={112} className="left-[-1.5rem] top-[-2rem] opacity-[0.16]" />
            <LeafSprig size={132} className="bottom-[-2.5rem] left-[-2rem] opacity-[0.14]" />
            <BlobMark size={200} className="bottom-[-3rem] right-[-3rem] opacity-[0.12]" />
          </div>

          <LockinShowcase />
        </div>
      </div>
    </section>
  );
}
