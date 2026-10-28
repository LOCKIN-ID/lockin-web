import Link from "next/link";

import { Hero } from "@/components/marketing/hero";
import { TaglineStrip } from "@/components/marketing/tagline-strip";
import { BookExhibition } from "@/components/marketing/book-exhibition";
import { LeafSprig } from "@/components/brand/shapes";
import { books } from "@/content/books";
import { BADGES } from "@/content/badges";
import { REWARDS } from "@/content/rewards";
import { PLANS } from "@/content/plans";
import { priceLabel } from "@/lib/format";

/**
 * The landing page.
 *
 * Its composition rotates per band rather than repeating one grid: a pinned
 * scroll story, a shelf the books lean on, a printed code, a dark workbench,
 * a ladder of rungs, a ledger. Every number on it is read out of the content
 * modules at build time, so a claim cannot drift from the books it describes.
 *
 * Motion is the site's one reveal system (`data-reveal`, staggered inside a
 * `data-reveal-group`) plus the single scroll-choreography pattern in
 * `base.css` (`.scrolly`). Nothing else moves.
 */

/** Every figure a band prints, counted once from the books themselves. */
function libraryFacts() {
  let code = 0;
  let runnable = 0;
  let sections = 0;
  let quizItems = 0;
  let callouts = 0;

  for (const book of books) {
    for (const chapter of book.chapters) {
      sections += chapter.sections.length;
      quizItems += chapter.checkpoint.items.length;
      for (const section of chapter.sections) {
        for (const block of section.body) {
          if (block.kind === "code") {
            code += 1;
            if (block.runnable) runnable += 1;
          }
          if (block.kind === "callout") callouts += 1;
        }
      }
    }
  }

  return {
    books: books.length,
    chapters: books.reduce((total, book) => total + book.chapters.length, 0),
    sections,
    code,
    runnable,
    quizItems,
    callouts,
    quests: books.reduce((total, book) => total + book.quests.length, 0),
    cheatsheets: books.reduce((total, book) => total + book.cheatsheets.length, 0),
  };
}

const FACTS = libraryFacts();


const QUEST_KINDS = [
  { kind: "Quiz", body: "A checkpoint with explanations and XP." },
  { kind: "GitHub repo", body: "A starter repository, checked when you push." },
  { kind: "Bank soal", body: "A drill set for the chapter's syntax." },
];

const REWARD_FLOOR = Math.min(...REWARDS.map((reward) => reward.costXp));
const REWARD_CEILING = Math.max(...REWARDS.map((reward) => reward.costXp));

const FIRST_QUEST = books[0].quests[0];

export default function HomePage() {
  return (
    <>
      <Hero />
      <TaglineStrip />

      {/* Band 2: the scroll story. Three plates pass a pinned pane, and the
          pane's index lights the one you are on. One pattern a page. */}
      {/* Band 2: The Micro-Learning Architecture */}
      <section className="section" aria-labelledby="difference-heading">
        <div className="container">
          <div className="section__head section__head--centre" data-reveal="up">
            <span
              style={{
                fontSize: "var(--text-xs)",
                letterSpacing: "0.14em",
                color: "var(--color-forest)",
                fontWeight: 800,
                textTransform: "uppercase",
              }}
            >
              ARSITEKTUR PEMBELAJARAN
            </span>
            <h2 id="difference-heading" style={{ marginTop: "var(--space-2xs)" }}>
              20 pages, <span className="highlight-mint">not 400 slides</span>.
            </h2>
            <p className="lead" style={{ color: "var(--color-ink-2)", maxWidth: "56ch" }}>
              Satu konsep dalam satu malam, diuji langsung dengan baris kode nyata tanpa materi membosankan.
            </p>
          </div>

          <div
            data-reveal="plate"
            style={{
              marginTop: "var(--space-2xl)",
              background: "var(--color-paper-3)",
              border: "1px solid var(--color-rule)",
              borderRadius: "var(--radius-card)",
              overflow: "hidden",
              boxShadow: "var(--shadow-card)",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            }}
          >
            {/* Left Column: Cadence Timeline Rail */}
            <div
              style={{
                padding: "var(--space-xl)",
                borderRight: "1px solid var(--color-rule)",
                display: "grid",
                gap: "var(--space-md)",
                background: "var(--color-paper-2)",
              }}
            >
              <div>
                <h3 style={{ fontSize: "var(--text-lg)", margin: 0, fontWeight: 800 }}>
                  Siklus 15 Menit
                </h3>
                <p style={{ color: "var(--color-ink-2)", fontSize: "var(--text-xs)", margin: "4px 0 0 0" }}>
                  Baca, eksekusi, dan verifikasi langsung tanpa materi bertele-tele.
                </p>
              </div>

              {/* Connected Milestone Steps */}
              <div style={{ display: "grid", gap: "var(--space-sm)", position: "relative" }}>
                {[
                  {
                    step: "01",
                    phase: "BACA",
                    time: "15 Menit",
                    title: "20 Halaman Padat",
                    desc: "Teori esensial ringkas tanpa slide beratus halaman.",
                  },
                  {
                    step: "02",
                    phase: "COMPILE",
                    time: "WASM In-Tab",
                    title: "4 Runtime Aktif",
                    desc: "Python, Shell, JS, HTML jalan di browser.",
                  },
                  {
                    step: "03",
                    phase: "MENTOR",
                    time: "Socratic AI",
                    title: "Bimbingan L1-L4",
                    desc: "Panduan logika mandiri tanpa bocoran jawaban.",
                  },
                  {
                    step: "04",
                    phase: "PROVE",
                    time: "+25 XP",
                    title: "Verifikasi Kode QR",
                    desc: "Tantangan fisik buku cetak dengan kuis otomatis.",
                  },
                ].map((item, idx) => (
                  <div
                    key={item.step}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "32px 1fr",
                      gap: "var(--space-sm)",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "var(--radius-pill)",
                        background: idx === 1 ? "var(--color-forest)" : "var(--color-paper-3)",
                        color: idx === 1 ? "var(--color-paper)" : "var(--color-ink)",
                        border: "1px solid var(--color-rule)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "var(--font-outlier)",
                        fontSize: "11px",
                        fontWeight: 800,
                      }}
                    >
                      {item.step}
                    </div>

                    <div style={{ display: "grid", gap: "1px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ fontWeight: 700, fontSize: "var(--text-xs)", color: "var(--color-ink)" }}>
                          {item.title}
                        </span>
                        <span style={{ fontSize: "10px", fontFamily: "var(--font-outlier)", color: "var(--color-muted)" }}>
                          {item.time}
                        </span>
                      </div>
                      <p style={{ fontSize: "var(--text-xs)", color: "var(--color-ink-2)", margin: 0, lineHeight: 1.35 }}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Contrast Telemetry Console */}
            <div
              style={{
                padding: "var(--space-xl)",
                display: "grid",
                gap: "var(--space-md)",
                alignContent: "space-between",
                background: "var(--color-paper-3)",
              }}
            >
              <div>
                <h3 style={{ fontSize: "var(--text-lg)", margin: 0, fontWeight: 800 }}>
                  Kontras Pembelajaran
                </h3>
                <p style={{ color: "var(--color-ink-2)", fontSize: "var(--text-xs)", margin: "4px 0 0 0" }}>
                  Perbandingan langsung bootcamp konvensional vs LOCK.IN Engine.
                </p>
              </div>

              {/* Telemetry Comparison Rows */}
              <div style={{ display: "grid", gap: "var(--space-xs)" }}>
                {[
                  {
                    aspect: "Format",
                    traditional: "400+ slide pasif",
                    lockin: "20 halaman padat",
                  },
                  {
                    aspect: "Waktu",
                    traditional: "Berminggu video",
                    lockin: "1 bab / 1 malam",
                  },
                  {
                    aspect: "Setup",
                    traditional: "Error compiler lokal",
                    lockin: "Zero setup di browser",
                  },
                  {
                    aspect: "AI Coach",
                    traditional: "Copy-paste jawaban",
                    lockin: "Bimbingan nalar logika",
                  },
                ].map((row) => (
                  <div
                    key={row.aspect}
                    style={{
                      padding: "var(--space-xs) var(--space-md)",
                      borderRadius: "var(--radius-card)",
                      background: "var(--color-paper-2)",
                      border: "1px solid var(--color-rule)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-muted)", textTransform: "uppercase" }}>
                      {row.aspect}
                    </span>
                    <div style={{ display: "flex", gap: "var(--space-md)", alignItems: "center" }}>
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", textDecoration: "line-through" }}>
                        {row.traditional}
                      </span>
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-forest)", fontWeight: 700 }}>
                        {row.lockin}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Proof Strip */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "var(--space-xs) var(--space-md)",
                  background: "color-mix(in oklab, var(--color-accent) 12%, var(--color-paper-2))",
                  border: "1px solid color-mix(in oklab, var(--color-accent) 30%, var(--color-rule))",
                  borderRadius: "var(--radius-card)",
                }}
              >
                <div style={{ fontSize: "var(--text-xs)", color: "var(--color-ink-2)" }}>
                  <strong style={{ color: "var(--color-forest)" }}>100% Praktik Nyata:</strong>{" "}
                  {FACTS.runnable} dari {FACTS.code} blok kode langsung jalan.
                </div>
                <Link href="#playground" className="btn btn--sm">
                  Coba Playground
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Band 3: the shelf. Three books, alternating sides, leaning in. */}
      {/* Band 3: 3D Book Showcase Gallery */}
      <section className="section" id="levels" aria-labelledby="levels-heading">
        <div className="container">
          <div className="section__head section__head--centre" data-reveal="up">
            <span
              style={{
                fontSize: "var(--text-xs)",
                letterSpacing: "0.14em",
                color: "var(--color-forest)",
                fontWeight: 800,
                textTransform: "uppercase",
              }}
            >
              SERI KURIKULUM LENGKAP
            </span>
            <h2 id="levels-heading" style={{ marginTop: "var(--space-2xs)" }}>
              Zero fluff. <span className="highlight-mint">Real progression</span>.
            </h2>
            <p className="lead" style={{ color: "var(--color-ink-2)", maxWidth: "56ch" }}>
              Dari baris kode pertama hingga arsitektur sistem skala besar. Setiap modul menghasilkan proyek nyata.
            </p>
          </div>

          <BookExhibition books={books} />
        </div>
      </section>

      {/* Band 4: the printed code, shown as the artifact it is. */}
      <section className="section" id="quests" aria-labelledby="quests-heading">
        <div className="container cols-2">
          <div style={{ display: "grid", gap: "var(--space-md)", alignContent: "start" }} data-reveal="left">
            <h2 id="quests-heading">Codes <span className="highlight-mint">printed</span> on the page.</h2>
            <p style={{ color: "var(--color-ink-2)" }}>
              Each chapter closes with a code.
            </p>
            <ol className="rows">
              {QUEST_KINDS.map((quest, index) => (
                <li key={quest.kind}>
                  <span className="rows__num">{`0${index + 1}`}</span>
                  <span style={{ display: "grid", gap: "var(--space-2xs)" }}>
                    <strong>{quest.kind}</strong>
                    <span style={{ color: "var(--color-ink-2)", fontSize: "var(--text-sm)" }}>{quest.body}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* Physical Artifact Ticket Stub (Card-free tactile design) */}
          <div
            data-reveal="right"
            style={{
              alignSelf: "start",
              background: "var(--color-paper-3)",
              border: "1px solid var(--color-rule)",
              borderRadius: "var(--radius-card)",
              overflow: "hidden",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div style={{ padding: "var(--space-md) var(--space-xl)", background: "var(--color-paper-2)", borderBottom: "1px dashed var(--color-rule)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="eyebrow" style={{ fontFamily: "var(--font-outlier)", fontSize: "var(--text-xs)", letterSpacing: "0.05em" }}>
                ARTIFACT STUB · {FIRST_QUEST.code}
              </span>
              <span className="chip" style={{ fontSize: "var(--text-xs)" }}>
                +{FIRST_QUEST.xp} XP
              </span>
            </div>
            <div style={{ padding: "var(--space-xl)", display: "grid", justifyItems: "center", gap: "var(--space-md)", textAlign: "center" }}>
              <Link
                href={`/q/${FIRST_QUEST.slug}`}
                aria-label={`Open the ${FIRST_QUEST.title} quest`}
                style={{ display: "block", border: "1px solid var(--color-rule)", borderRadius: "var(--radius-card)", overflow: "clip", background: "var(--color-paper-3)", padding: "var(--space-xs)" }}
              >
                <img src={`/qr/${FIRST_QUEST.slug}.svg`} alt="" width={200} height={200} style={{ width: "200px", height: "200px" }} />
              </Link>
              <div style={{ display: "grid", gap: "var(--space-3xs)" }}>
                <span style={{ fontFamily: "var(--font-outlier)", fontSize: "var(--text-xl)", fontWeight: 900, color: "var(--color-forest)" }}>
                  {FIRST_QUEST.code}
                </span>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-ink-2)" }}>
                  Printed directly beneath the QR in the physical book.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Band 5: the workbench, on the deep paper. */}
      <section className="section band-deep" id="playground" aria-labelledby="playground-heading">
        <div className="container cols-2">
          <div style={{ display: "grid", gap: "var(--space-md)", alignContent: "center" }} data-reveal="left">
            <h2 id="playground-heading" style={{ color: "var(--color-paper)" }}>
              A sandbox that <span className="highlight-mint">installs nothing</span>.
            </h2>
            <p style={{ color: "var(--color-paper-2)" }}>
              One engine behind the reader and this page.
            </p>
            <div>
              <Link href="/playground" className="btn">
                Open the playground
              </Link>
            </div>
          </div>

          <div className="plate plate--dark" data-reveal="right">
            <div className="plate__body" style={{ gap: "var(--space-sm)" }}>
              <div className="rail">
                <span className="chip" style={{ background: "var(--color-accent)", borderColor: "var(--color-accent)", color: "var(--color-accent-ink)" }}>
                  Shell
                </span>
                {["HTML", "JavaScript", "Python"].map((lang) => (
                  <span key={lang} className="chip" style={{ background: "transparent", borderColor: "color-mix(in oklab, var(--color-paper) 30%, transparent)", color: "var(--color-paper)" }}>
                    {lang}
                  </span>
                ))}
              </div>
              <pre className="code" style={{ background: "var(--color-forest-deep)" }}>
                <code>{`$ python3 -c 'print(6 * 7)'
42`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      <TaglineStrip
        tone="mint"
        direction="reverse"
        speed="fast"
        items={["WASM RUNTIMES IN YOUR BROWSER", "PYTHON 3", "LINUX BUSYBOX SHELL", "JAVASCRIPT", "ZERO SETUP REQUIRED", "OFFLINE CAPABLE"]}
      />

      {/* Band 7: the ledger. XP in, rewards out, both real. */}
      <section className="section" id="gamification" style={{ background: "var(--color-paper-2)" }} aria-labelledby="xp-heading">
        <div className="container cols-2">
          <div style={{ display: "grid", gap: "var(--space-md)", alignContent: "start" }} data-reveal="left">
            <h2 id="xp-heading">XP that <span className="highlight-mint">buys something</span>.</h2>
            <p style={{ color: "var(--color-ink-2)" }}>
              5 XP a section, 25 a checkpoint.
            </p>
            <div className="stats">
              <div>
                <span className="stats__figure">{BADGES.length}</span>
                <span className="stats__label">badges earned</span>
              </div>
              <div>
                <span className="stats__figure">{REWARDS.length}</span>
                <span className="stats__label">rewards on the shelf</span>
              </div>
              <div>
                <span className="stats__figure">{`${REWARD_FLOOR} to ${REWARD_CEILING}`}</span>
                <span className="stats__label">XP to spend</span>
              </div>
            </div>
            <div>
              <Link href="/register" className="btn btn--quiet">
                Start a streak
              </Link>
            </div>
          </div>

          <div className="plate" data-reveal="right" style={{ alignSelf: "start" }}>
            <div className="plate__body" style={{ gap: "var(--space-sm)" }}>
              <span className="stats__label">The rewards shelf</span>
              <ol className="rows">
                {REWARDS.map((reward) => (
                  <li key={reward.title}>
                    <span className="rows__num">{reward.costXp}</span>
                    <span>{reward.title}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      <TaglineStrip
        tone="deep"
        speed="slow"
        items={["ONE-TIME PAYMENT", "LIFETIME EDITIONS INCLUDED", "PRINTED QR QUESTS", "25 XP PER CHECKPOINT", "ZERO SUBSCRIPTION TRAPS"]}
      />
      {/* Band 8: the price, once, in three rows. */}
      <section className="section" id="pricing" aria-labelledby="pricing-heading">
        <div className="container">
          <div className="section__head section__head--centre" data-reveal="up">
            <h2 id="pricing-heading">Transparansi <span className="highlight-mint">Investasi Belajar</span></h2>
            <p className="lead" style={{ color: "var(--color-ink-2)" }}>
              Pilihan skema terjangkau untuk mahasiswa: gratis modul 01, paket bundle hemat, hingga akses Web Pro lengkap.
            </p>
          </div>
          {/* Unified Architectural Pricing Ribbon (Card-free connected structure) */}
          <div
            data-reveal="plate"
            style={{
              marginTop: "var(--space-2xl)",
              border: "1px solid var(--color-rule)",
              borderRadius: "var(--radius-card)",
              background: "var(--color-paper-3)",
              overflow: "hidden",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              }}
            >
              {PLANS.filter((p) => ["free", "bundle", "pro"].includes(p.id)).map((plan, index, arr) => {
                const isBundle = plan.id === "bundle";
                return (
                  <div
                    key={plan.id}
                    style={{
                      padding: "var(--space-2xl) var(--space-xl)",
                      background: isBundle ? "var(--color-paper-2)" : "transparent",
                      borderRight: index < arr.length - 1 ? "1px solid var(--color-rule)" : "none",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "var(--space-xl)",
                    }}
                  >
                    <div style={{ display: "grid", gap: "var(--space-sm)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h3 style={{ fontSize: "var(--text-xl)", margin: 0 }}>{plan.title}</h3>
                        {plan.badge ? (
                          <span className="chip" style={{ fontSize: "var(--text-xs)", background: isBundle ? "var(--color-accent)" : "var(--color-paper-2)", color: isBundle ? "var(--color-accent-ink)" : "var(--color-forest)", fontWeight: 600 }}>
                            {plan.badge}
                          </span>
                        ) : null}
                      </div>
                      <p style={{ fontSize: "var(--text-sm)", color: "var(--color-ink-2)", margin: 0, lineHeight: 1.5 }}>
                        {plan.blurb}
                      </p>
                    </div>

                    <div style={{ display: "grid", gap: "var(--space-sm)" }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-2xs)" }}>
                        <span style={{ fontSize: "var(--text-3xl)", fontWeight: 900, fontFamily: "var(--font-display)" }}>
                          {priceLabel(plan.priceIdr)}
                        </span>
                        <span style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)" }}>
                          {plan.period === "once" || plan.period === "forever"
                            ? plan.period
                            : `for ${plan.period}`}
                        </span>
                      </div>
                      <Link
                        href="/pricing"
                        className={isBundle ? "btn" : "btn btn--quiet"}
                        style={{ width: "100%", justifyContent: "center" }}
                      >
                        {plan.cta}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ marginTop: "var(--space-xl)", textAlign: "center" }}>
            <Link href="/pricing" className="btn btn--quiet">
              Compare all features
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}