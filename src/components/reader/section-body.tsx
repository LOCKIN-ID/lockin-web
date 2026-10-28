"use client";

import { useEffect, useState } from "react";
import type { Section } from "@/content/types";
import { BlockRenderer } from "./block-renderer";
import { BookmarkButton } from "./bookmark-button";
import { completeSection, saveProgress, type SectionResult } from "@/app/(app)/app/books/[slug]/actions";

interface Props {
  bookSlug: string;
  chapterId: string;
  chapterTitle: string;
  section: Section;
  isBookmarked: boolean;
  isCompleted: boolean;
  onCompleted?: (result: SectionResult) => void;
  onOpenKeyword?: (term: string) => void;
  onNext?: () => void;
}

export function SectionBody({
  bookSlug,
  chapterId,
  chapterTitle,
  section,
  isBookmarked,
  isCompleted: initialCompleted,
  onCompleted,
  onOpenKeyword,
  onNext,
}: Props) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setCompleted(initialCompleted);
    setFeedback(null);
  }, [section.id, initialCompleted]);

  // 15s Heartbeat for tracking reading time
  useEffect(() => {
    const timer = setInterval(() => {
      saveProgress({
        bookSlug,
        chapterId,
        sectionId: section.id,
        seconds: 15,
      }).catch(() => {});
    }, 15_000);

    return () => clearInterval(timer);
  }, [bookSlug, chapterId, section.id]);

  const handleComplete = async () => {
    if (pending) return;
    setPending(true);
    try {
      const res = await completeSection({
        bookSlug,
        chapterId,
        sectionId: section.id,
      });

      if (res.ok) {
        setCompleted(true);
        if (res.xpAwarded > 0) {
          setFeedback(`+${res.xpAwarded} XP awarded · Streak: ${res.streak} days`);
        } else {
          setFeedback("Section completed!");
        }
        onCompleted?.(res);
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <article
      style={{
        display: "grid",
        gap: "var(--space-xl)",
        maxWidth: "68ch", // measure capped at 68ch per design rule
      }}
    >
      {/* Section Header */}
      <header style={{ borderBottom: "1px solid var(--color-rule)", paddingBottom: "var(--space-md)", display: "grid", gap: "var(--space-2xs)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "var(--text-xs)", fontFamily: "var(--font-outlier)", color: "var(--color-forest)", fontWeight: 700 }}>
            {chapterTitle}
          </span>
          <div style={{ display: "flex", gap: "var(--space-xs)", alignItems: "center" }}>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
              ⏱ ~{section.minutes} min
            </span>
            <BookmarkButton
              bookSlug={bookSlug}
              chapterId={chapterId}
              sectionId={section.id}
              initialBookmarked={isBookmarked}
              label={section.title}
            />
          </div>
        </div>

        <h2 style={{ fontSize: "var(--text-2xl)" }}>{section.title}</h2>
      </header>

      {/* Body Blocks */}
      <div>
        <BlockRenderer
          blocks={section.body}
          onOpenKeyword={onOpenKeyword}
          bookSlug={bookSlug}
        />
      </div>

      {/* Completion & Next Footer */}
      <footer
        style={{
          marginTop: "var(--space-2xl)",
          paddingTop: "var(--space-lg)",
          borderTop: "1px solid var(--color-rule)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "var(--space-md)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
          <button
            type="button"
            className={completed ? "btn btn--quiet btn--sm" : "btn btn--sm"}
            onClick={handleComplete}
            disabled={pending}
            aria-busy={pending}
          >
            {completed ? "✓ Completed" : "Mark Section Complete (+5 XP)"}
          </button>

          {feedback ? (
            <span
              className="chip"
              style={{
                background: "color-mix(in oklab, var(--color-accent) 25%, var(--color-paper))",
                borderColor: "var(--color-accent)",
                fontSize: "var(--text-xs)",
              }}
              role="status"
            >
              {feedback}
            </span>
          ) : null}
        </div>

        {onNext ? (
          <button type="button" className="btn btn--quiet btn--sm" onClick={onNext}>
            Next Section
          </button>
        ) : null}
      </footer>
    </article>
  );
}
