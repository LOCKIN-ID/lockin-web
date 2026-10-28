"use client";

import Link from "next/link";
import { CodeBlock } from "@/components/code-block";
import { Spark4 } from "@/components/icons";
import { Markdown } from "@/components/marketing/markdown";
import type { Block } from "@/content/types";

interface Props {
  blocks: Block[];
  onOpenKeyword?: (term: string) => void;
  bookSlug: string;
}

export function BlockRenderer({ blocks, onOpenKeyword }: Props) {
  return (
    <div style={{ display: "grid", gap: "var(--space-lg)" }}>
      {blocks.map((block, idx) => {
        if (block.kind === "text") {
          return (
            <div key={idx} style={{ lineHeight: 1.65, fontSize: "var(--text-md)" }}>
              <Markdown md={block.md} />
            </div>
          );
        }

        if (block.kind === "code") {
          return (
            <div key={idx} style={{ marginBlock: "var(--space-sm)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3xs)" }}>
                <span style={{ fontSize: "var(--text-xs)", fontFamily: "var(--font-outlier)", color: "var(--color-muted)", textTransform: "uppercase" }}>
                  {block.lang} {block.runnable ? "· Runnable" : "· Read-only"}
                </span>
                {block.runnable ? (
                  <Link
                    href={`/app/playground#s=${encodeURIComponent(block.code)}`}
                    className="btn btn--quiet btn--sm"
                    style={{ fontSize: "var(--text-xs)", padding: "0 var(--space-xs)", height: "28px", minHeight: "28px" }}
                  >
                    Run in playground
                  </Link>
                ) : null}
              </div>
              <CodeBlock code={block.code} language={block.lang} />
              {block.caption ? (
                <div style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", marginTop: "var(--space-3xs)" }}>
                  {block.caption}
                </div>
              ) : null}
            </div>
          );
        }

        if (block.kind === "callout") {
          const colors: Record<string, string> = {
            tip: "var(--color-accent)",
            trap: "var(--color-error)",
            fact: "var(--color-forest)",
          };
          const border = colors[block.tone] ?? "var(--color-forest)";

          return (
            <div
              key={idx}
              className="well"
              style={{
                padding: "var(--space-md) var(--space-lg)",
                border: "1px solid var(--color-rule)",
                borderRadius: "var(--radius-card)",
                display: "grid",
                gap: "var(--space-xs)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
                <span className="chip" style={{ fontSize: "var(--text-xs)", textTransform: "capitalize" }}>
                  {block.tone}
                </span>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-ink)" }}>
                  {block.title}
                </span>
              </div>
              <div style={{ fontSize: "var(--text-sm)", lineHeight: 1.5, color: "var(--color-ink-2)" }}>
                <Markdown md={block.md} />
              </div>
            </div>
          );
        }

        if (block.kind === "keyword") {
          return (
            <div key={idx} style={{ display: "inline-flex", margin: "var(--space-xs) 0" }}>
              <button
                type="button"
                className="chip"
                onClick={() => onOpenKeyword?.(block.term)}
                style={{
                  background: "var(--color-paper-2)",
                  color: "var(--color-forest)",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Spark4 size={16} />
                Concept: {block.term}
              </button>
            </div>
          );
        }

        if (block.kind === "figure") {
          return (
            <figure key={idx} style={{ marginBlock: "var(--space-md)", textAlign: "center" }}>
              <div className="panel" style={{ padding: "var(--space-xl)", background: "var(--color-paper-2)", display: "inline-block" }}>
                <span style={{ fontFamily: "var(--font-outlier)", fontSize: "var(--text-sm)", color: "var(--color-muted)" }}>
                  [{block.figure.toUpperCase()}]
                </span>
              </div>
              {block.caption ? (
                <figcaption style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", marginTop: "var(--space-xs)" }}>
                  {block.caption}
                </figcaption>
              ) : null}
            </figure>
          );
        }

        if (block.kind === "questGate") {
          return (
            <div
              key={idx}
              className="panel"
              style={{
                padding: "var(--space-xl)",
                border: "2px dashed var(--color-rule)",
                background: "var(--color-paper-2)",
                textAlign: "center",
                display: "grid",
                gap: "var(--space-xs)",
                placeItems: "center",
              }}
            >
              <span className="chip">Interactive Quest Gate</span>
              <h4>Hands-on Exercise</h4>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-ink-2)", maxWidth: "50ch" }}>
                Scan the QR code in your print copy or enter the 6-character code printed under it to complete this milestone.
              </p>
              <Link href={`/app/quests/${block.questSlug}`} className="btn btn--sm" style={{ marginTop: "var(--space-xs)" }}>
                Open Quest
              </Link>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
