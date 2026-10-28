"use client";

import { useMemo, useState } from "react";
import type { CheatsheetEntry } from "@/content/types";

interface Props {
  entries: CheatsheetEntry[];
  isOpen: boolean;
  onClose: () => void;
  selectedTerm?: string | null;
}

export function CheatsheetDrawer({ entries, isOpen, onClose, selectedTerm }: Props) {
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    if (!filter.trim()) return entries;
    const q = filter.toLowerCase();
    return entries.filter(
      (e) =>
        e.term.toLowerCase().includes(q) ||
        e.meaning.toLowerCase().includes(q) ||
        (e.snippet && e.snippet.code.toLowerCase().includes(q)),
    );
  }, [entries, filter]);

  if (!isOpen) return null;

  return (
    <div
      className="overlay-fade"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: "var(--z-drawer)",
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        justifyContent: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        className="drawer-enter"
        style={{
          width: "100%",
          maxWidth: "480px",
          height: "100%",
          background: "var(--color-paper)",
          boxShadow: "var(--shadow-overlay)",
          display: "flex",
          flexDirection: "column",
          padding: "var(--space-xl)",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-lg)" }}>
          <div>
            <h3 style={{ fontSize: "var(--text-xl)" }}>Cheatsheets &amp; Concepts</h3>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
              {entries.length} terms across this book
            </p>
          </div>
          <button type="button" className="btn btn--quiet btn--sm" onClick={onClose} aria-label="Close cheatsheet">
            ✕
          </button>
        </div>

        <input
          type="search"
          className="input"
          placeholder="Filter concepts or syntax..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ marginBottom: "var(--space-lg)" }}
        />

        <div style={{ display: "grid", gap: "var(--space-md)", flex: 1 }}>
          {filtered.map((item) => {
            const isHighlight = selectedTerm === item.term;
            return (
              <div
                key={item.term}
                className="panel"
                style={{
                  padding: "var(--space-md)",
                  background: isHighlight ? "color-mix(in oklab, var(--color-accent) 20%, var(--color-paper-3))" : "var(--color-paper-3)",
                  border: isHighlight ? "1px solid var(--color-accent)" : "1px solid var(--color-rule)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "var(--space-2xs)" }}>
                  <strong style={{ color: "var(--color-forest)", fontFamily: "var(--font-outlier)" }}>
                    {item.term}
                  </strong>
                </div>

                {item.snippet ? (
                  <div
                    style={{
                      fontFamily: "var(--font-outlier)",
                      fontSize: "var(--text-xs)",
                      padding: "var(--space-2xs) var(--space-xs)",
                      background: "var(--color-paper)",
                      borderRadius: "var(--radius-card)",
                      border: "1px solid var(--color-rule)",
                      marginBottom: "var(--space-xs)",
                    }}
                  >
                    <code>{item.snippet.code}</code>
                  </div>
                ) : null}

                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-ink-2)", lineHeight: 1.4, margin: 0 }}>
                  {item.meaning}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
