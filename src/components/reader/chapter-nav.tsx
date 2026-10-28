"use client";

import type { Chapter } from "@/content/types";

interface Props {
  chapters: Chapter[];
  activeChapterId: string;
  activeSectionId: string;
  onSelect: (chapterId: string, sectionId: string) => void;
  completedSectionIds: Set<string>;
}

export function ChapterNav({
  chapters,
  activeChapterId,
  activeSectionId,
  onSelect,
  completedSectionIds,
}: Props) {
  return (
    <nav
      aria-label="Book chapters and sections"
      style={{
        display: "grid",
        gap: "var(--space-md)",
      }}
    >
      {chapters.map((ch, idx) => {
        const isChapterActive = ch.id === activeChapterId;
        const completedCount = ch.sections.filter((s) => completedSectionIds.has(s.id)).length;
        const allSectionsDone = completedCount === ch.sections.length && ch.sections.length > 0;

        return (
          <div
            key={ch.id}
            className="panel"
            style={{
              padding: "var(--space-md)",
              background: isChapterActive ? "var(--color-paper-3)" : "var(--color-paper)",
              borderColor: isChapterActive ? "var(--color-forest)" : "var(--color-rule)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "var(--space-2xs)" }}>
              <span style={{ fontSize: "var(--text-xs)", fontFamily: "var(--font-outlier)", color: "var(--color-forest)", fontWeight: 700 }}>
                Chapter {idx + 1}
              </span>
              {allSectionsDone ? (
                <span style={{ color: "var(--color-forest)", fontSize: "var(--text-xs)" }}>✓ Done</span>
              ) : (
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", fontFamily: "var(--font-outlier)" }}>
                  {completedCount}/{ch.sections.length}
                </span>
              )}
            </div>

            <h4 style={{ fontSize: "var(--text-sm)", marginBottom: "var(--space-xs)" }}>
              {ch.title}
            </h4>

            {/* Sections List */}
            <ol style={{ display: "grid", gap: "var(--space-3xs)", marginTop: "var(--space-xs)" }}>
              {ch.sections.map((sec) => {
                const isSelected = isChapterActive && sec.id === activeSectionId;
                const isDone = completedSectionIds.has(sec.id);

                return (
                  <li key={sec.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(ch.id, sec.id)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "var(--space-2xs) var(--space-xs)",
                        borderRadius: "var(--radius-card)",
                        fontSize: "var(--text-xs)",
                        background: isSelected ? "var(--color-paper-2)" : "transparent",
                        fontWeight: isSelected ? 700 : 400,
                        color: isSelected ? "var(--color-ink)" : "var(--color-ink-2)",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "var(--space-xs)",
                      }}
                    >
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {sec.title}
                      </span>
                      {isDone ? (
                        <span style={{ color: "var(--color-forest)", fontWeight: 700 }}>✓</span>
                      ) : null}
                    </button>
                  </li>
                );
              })}

              {/* Checkpoint row */}
              <li style={{ marginTop: "var(--space-3xs)", paddingTop: "var(--space-3xs)", borderTop: "1px dashed var(--color-rule)" }}>
                <button
                  type="button"
                  onClick={() => onSelect(ch.id, "checkpoint")}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "var(--space-2xs) var(--space-xs)",
                    borderRadius: "var(--radius-card)",
                    fontSize: "var(--text-xs)",
                    background: isChapterActive && activeSectionId === "checkpoint" ? "var(--color-paper-2)" : "transparent",
                    fontWeight: isChapterActive && activeSectionId === "checkpoint" ? 700 : 500,
                    color: "var(--color-forest)",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>🎯 Checkpoint Quiz</span>
                  <span style={{ fontSize: "10px", fontFamily: "var(--font-outlier)" }}>+{ch.checkpoint.xp} XP</span>
                </button>
              </li>
            </ol>
          </div>
        );
      })}
    </nav>
  );
}
