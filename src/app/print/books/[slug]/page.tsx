import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getBook, books } from "@/content/books";
import { Stamp, Wordmark } from "@/components/brand/logo";
import type { Block } from "@/content/types";

interface Props {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export async function generateStaticParams() {
  return books.map((b) => ({ slug: b.slug }));
}

export default async function PrintBookPage({ params }: Props) {
  const { slug } = await params;
  const book = getBook(slug);
  if (!book) notFound();

  // Divide sections and chapters into print pages
  const pages: React.ReactNode[] = [];

  // Page 1: Cover Page
  pages.push(
    <div key="page-1" className="print-page cover-page" style={{ background: "var(--color-forest-deep)", color: "var(--color-paper)", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "40mm 20mm 20mm" }}>
      <div>
        <Stamp size={56} />
        <div style={{ marginTop: "30mm" }}>
          <h1 style={{ color: "var(--color-paper)", fontSize: "36pt", lineHeight: 1.1, marginTop: "8mm", maxWidth: "16ch" }}>
            {book.title}
          </h1>
          <p style={{ color: "var(--color-paper-2)", fontSize: "14pt", marginTop: "6mm", maxWidth: "35ch", lineHeight: 1.5 }}>
            {book.promise}
          </p>
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--color-forest)", paddingTop: "8mm", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: "10pt", color: "var(--color-taupe)" }}>LOCK.IN PRESS · JAKARTA</div>
          <div style={{ fontSize: "9pt", color: "var(--color-muted)" }}>15 to 25 Pages · High-Density Interactive Curriculum</div>
        </div>
        <Wordmark height={20} />
      </div>
    </div>
  );

  // Page 2: Table of Contents & Roadmap
  pages.push(
    <div key="page-2" className="print-page" style={{ padding: "20mm", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "2px solid var(--color-rule)", paddingBottom: "4mm", marginBottom: "8mm" }}>
          <h2>Curriculum &amp; Table of Contents</h2>
          <span style={{ fontFamily: "var(--font-outlier)", fontSize: "10pt", color: "var(--color-muted)" }}>{book.title}</span>
        </div>

        <ol style={{ display: "grid", gap: "6mm", fontSize: "11pt" }}>
          {book.chapters.map((ch, idx) => (
            <li key={ch.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px dotted var(--color-rule)", paddingBottom: "2mm" }}>
              <div>
                <strong>Chapter {idx + 1}: {ch.title}</strong>
                <div style={{ fontSize: "9pt", color: "var(--color-ink-2)" }}>{ch.goal}</div>
              </div>
              <span style={{ fontFamily: "var(--font-outlier)", fontWeight: 700 }}>p. {idx * 3 + 4}</span>
            </li>
          ))}
        </ol>
      </div>

      <div style={{ borderTop: "1px solid var(--color-rule)", paddingTop: "4mm", display: "flex", justifyContent: "space-between", fontSize: "9pt", color: "var(--color-muted)" }}>
        <span>LOCK.IN · {book.title}</span>
        <span style={{ fontFamily: "var(--font-outlier)", fontWeight: 700 }}>Page 2</span>
      </div>
    </div>
  );

  // Page 3: Cheatsheet Index
  pages.push(
    <div key="page-3" className="print-page" style={{ padding: "20mm", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "2px solid var(--color-rule)", paddingBottom: "4mm", marginBottom: "8mm" }}>
          <h2>Quick Reference &amp; Syntax Cheatsheet</h2>
          <span style={{ fontFamily: "var(--font-outlier)", fontSize: "10pt", color: "var(--color-muted)" }}>Reference</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5mm" }}>
          {book.cheatsheets.map((cs) => (
            <div key={cs.term} style={{ border: "1px solid var(--color-rule)", borderRadius: "4px", padding: "4mm", background: "var(--color-paper-3)" }}>
              <div style={{ fontSize: "9pt", fontWeight: 700, color: "var(--color-forest)" }}>
                {cs.term}
              </div>
              {cs.snippet ? (
                <div style={{ fontFamily: "var(--font-outlier)", fontSize: "8.5pt", marginBlock: "2mm", background: "var(--color-paper-2)", padding: "2mm", borderRadius: "3px" }}>
                  <code>{cs.snippet.code}</code>
                </div>
              ) : null}
              <p style={{ fontSize: "8.5pt", color: "var(--color-ink-2)", margin: 0, lineHeight: 1.3 }}>
                {cs.meaning}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--color-rule)", paddingTop: "4mm", display: "flex", justifyContent: "space-between", fontSize: "9pt", color: "var(--color-muted)" }}>
        <span>LOCK.IN · Cheatsheet</span>
        <span style={{ fontFamily: "var(--font-outlier)", fontWeight: 700 }}>Page 3</span>
      </div>
    </div>
  );

  // Pages 4–N: Chapters & Sections with QR Codes
  let currentPageNumber = 4;
  book.chapters.forEach((chapter, chIdx) => {
    chapter.sections.forEach((section, sIdx) => {
      const quest = book.quests[chIdx % book.quests.length];

      pages.push(
        <div
          key={`page-${currentPageNumber}`}
          className="print-page"
          style={{ padding: "20mm", display: "flex", flexDirection: "column", justifyContent: "space-between" }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid var(--color-rule)", paddingBottom: "3mm", marginBottom: "6mm" }}>
              <span style={{ fontSize: "9pt", textTransform: "uppercase", fontWeight: 700, color: "var(--color-forest)" }}>
                Chapter {chIdx + 1} · Section {sIdx + 1}
              </span>
              <span style={{ fontFamily: "var(--font-outlier)", fontSize: "9pt", color: "var(--color-muted)" }}>
                {chapter.title}
              </span>
            </div>

            <h3 style={{ fontSize: "16pt", marginBottom: "4mm" }}>{section.title}</h3>

            <div style={{ display: "grid", gap: "4mm" }}>
              {section.body.slice(0, 3).map((b: Block, bIdx: number) => {
                if (b.kind === "text") {
                  return <p key={bIdx} style={{ fontSize: "9.5pt", lineHeight: 1.6, margin: 0 }}>{b.md}</p>;
                }
                if (b.kind === "code") {
                  return (
                    <div key={bIdx} style={{ background: "var(--color-ink)", color: "var(--color-paper)", padding: "4mm", borderRadius: "4px", fontFamily: "var(--font-outlier)", fontSize: "8.5pt", lineHeight: 1.4 }}>
                      <pre style={{ margin: 0 }}><code>{b.code}</code></pre>
                    </div>
                  );
                }
                if (b.kind === "callout") {
                  return (
                    <div key={bIdx} style={{ padding: "3mm 4mm", borderLeft: "3px solid var(--color-accent)", background: "var(--color-paper-2)", fontSize: "9pt" }}>
                      <strong>{b.tone.toUpperCase()}:</strong> {b.title}
                    </div>
                  );
                }
                return null;
              })}
            </div>

            {/* Print QR code card (at >= 22mm with 6-char fallback) */}
            {quest && sIdx === chapter.sections.length - 1 ? (
              <div
                style={{
                  marginTop: "8mm",
                  border: "1px dashed var(--color-forest)",
                  padding: "4mm 6mm",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6mm",
                  background: "var(--color-paper-2)",
                }}
              >
                <div style={{ width: "24mm", height: "24mm", background: "var(--color-paper-3)", display: "grid", placeItems: "center", border: "1px solid var(--color-rule)" }}>
                  <img src={`/qr/${quest.slug}.svg`} alt="" width={80} height={80} style={{ width: "22mm", height: "22mm" }} />
                </div>
                <div>
                  <div style={{ fontSize: "8.5pt", fontWeight: 700, color: "var(--color-forest)" }}>SCAN TO RUN CODE &amp; QUIZ</div>
                  <div style={{ fontSize: "9pt", fontWeight: 700 }}>{quest.title}</div>
                  <div style={{ fontFamily: "var(--font-outlier)", fontSize: "9pt", marginTop: "1mm" }}>
                    Manual Code: <strong>{quest.code}</strong> (+{quest.xp} XP)
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div style={{ borderTop: "1px solid var(--color-rule)", paddingTop: "4mm", display: "flex", justifyContent: "space-between", fontSize: "9pt", color: "var(--color-muted)" }}>
            <span>LOCK.IN · {book.title}</span>
            <span style={{ fontFamily: "var(--font-outlier)", fontWeight: 700 }}>Page {currentPageNumber}</span>
          </div>
        </div>
      );
      currentPageNumber++;
    });
  });

  return (
    <div className="print-document">
      <style>{`
        @page {
          size: A4 portrait;
          margin: 0;
        }
        @media screen {
          body {
            background: #E5E5E5;
          }
          .print-document {
            display: grid;
            gap: 20px;
            padding: 20px;
            justify-content: center;
          }
          .print-page {
            width: 210mm;
            min-height: 297mm;
            background: #F1F1EB;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            box-sizing: border-box;
          }
        }
        @media print {
          body {
            background: transparent;
            margin: 0;
            padding: 0;
          }
          .print-page {
            width: 210mm;
            height: 297mm;
            page-break-after: always;
            box-sizing: border-box;
          }
        }
      `}</style>
      {pages}
    </div>
  );
}
