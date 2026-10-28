"use client";

import { useState } from "react";
import type { Checkpoint as CheckpointType, QuizItem } from "@/content/types";
import { saveCheckpointAttempt, type CheckpointResult } from "@/app/(app)/app/books/[slug]/actions";

interface Props {
  bookSlug: string;
  chapterId: string;
  checkpoint: CheckpointType;
  onFinish?: (result: CheckpointResult) => void;
}

export function CheckpointView({ bookSlug, chapterId, checkpoint, onFinish }: Props) {
  const [items, setItems] = useState<QuizItem[]>(() => checkpoint.items);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [hintsUsed, setHintsUsed] = useState<Record<number, boolean>>({});
  const [showHint, setShowHint] = useState(false);
  const [result, setResult] = useState<CheckpointResult | null>(null);
  const [saving, setSaving] = useState(false);

  const currentItem = items[currentIndex];
  const total = items.length;

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);

    if (idx === currentItem.answerIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const handleUseHint = () => {
    setShowHint(true);
    setHintsUsed((prev) => ({ ...prev, [currentIndex]: true }));
  };

  const handleNext = async () => {
    if (currentIndex + 1 < total) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setShowHint(false);
    } else {
      // Completed all items, save attempt!
      setSaving(true);
      const hintCount = Object.keys(hintsUsed).length;
      try {
        const res = await saveCheckpointAttempt({
          bookSlug,
          chapterId,
          score,
          hintCount,
        });
        setResult(res);
        onFinish?.(res);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleRetry = () => {
    // Shuffle options for retry
    const shuffled = checkpoint.items.map((it) => {
      const indexed = it.options.map((opt, i) => ({ opt, originalIndex: i }));
      for (let i = indexed.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = indexed[i];
        indexed[i] = indexed[j];
        indexed[j] = temp;
      }
      const newAnswerIndex = indexed.findIndex((x) => x.originalIndex === it.answerIndex);
      return {
        ...it,
        options: indexed.map((x) => x.opt),
        answerIndex: newAnswerIndex,
      };
    });

    setItems(shuffled);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setShowHint(false);
    setScore(0);
    setHintsUsed({});
    setResult(null);
  };

  if (result) {
    const passed = result.passed;
    return (
      <div
        className="panel"
        style={{
          padding: "var(--space-2xl)",
          textAlign: "center",
          background: "var(--color-paper-3)",
          display: "grid",
          gap: "var(--space-md)",
          placeItems: "center",
        }}
      >
        <span
          className="chip"
          style={{
            background: passed ? "var(--color-forest)" : "var(--color-paper-2)",
            color: passed ? "var(--color-paper)" : "var(--color-ink)",
          }}
        >
          {passed ? "Checkpoint Cleared!" : "Keep Practicing"}
        </span>

        <h2>
          {passed ? "Great work! Concept mastered." : "Not quite there yet."}
        </h2>

        <div style={{ fontFamily: "var(--font-outlier)", fontSize: "var(--text-3xl)", fontWeight: 900 }}>
          {result.score} / {result.total}
        </div>

        <p style={{ color: "var(--color-ink-2)", maxWidth: "50ch", fontSize: "var(--text-sm)" }}>
          {passed
            ? `You scored ${Math.round((result.score / result.total) * 100)}% (pass requirement: ${Math.round(checkpoint.passRatio * 100)}%). ${result.xpAwarded > 0 ? `+${result.xpAwarded} XP awarded!` : ""}`
            : `You scored ${Math.round((result.score / result.total) * 100)}%. A score of ${Math.round(checkpoint.passRatio * 100)}% is needed to clear this checkpoint.`}
        </p>

        {result.newBadges.length > 0 ? (
          <div style={{ display: "flex", gap: "var(--space-xs)", marginTop: "var(--space-xs)" }}>
            {result.newBadges.map((b) => (
              <span key={b.slug} className="chip" style={{ background: "var(--color-accent)", color: "var(--color-accent-ink)" }}>
                🎖️ New Badge: {b.title} (+{b.xpReward} XP)
              </span>
            ))}
          </div>
        ) : null}

        <div style={{ display: "flex", gap: "var(--space-sm)", marginTop: "var(--space-md)" }}>
          <button type="button" className="btn btn--quiet btn--sm" onClick={handleRetry}>
            🔄 Retry with shuffled options
          </button>
        </div>
      </div>
    );
  }

  if (!currentItem) return null;

  return (
    <div className="panel" style={{ padding: "var(--space-xl)", background: "var(--color-paper-3)" }}>
      {/* Progress & Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "var(--space-md)", borderBottom: "1px solid var(--color-rule)", paddingBottom: "var(--space-sm)" }}>
        <div>
          <span className="chip" style={{ fontSize: "var(--text-xs)" }}>
            Question {currentIndex + 1} of {total}
          </span>
          <h3 style={{ fontSize: "var(--text-lg)", marginTop: "var(--space-2xs)" }}>
            {checkpoint.title}
          </h3>
        </div>
        <span style={{ fontFamily: "var(--font-outlier)", fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
          Pass: {Math.round(checkpoint.passRatio * 100)}%
        </span>
      </div>

      {/* Prompt */}
      <p style={{ fontSize: "var(--text-md)", fontWeight: 600, lineHeight: 1.5, marginBottom: "var(--space-lg)" }}>
        {currentItem.prompt}
      </p>

      {/* Options */}
      <div style={{ display: "grid", gap: "var(--space-sm)" }}>
        {currentItem.options.map((opt, idx) => {
          let btnStyle: React.CSSProperties = {
            textAlign: "left",
            justifyContent: "flex-start",
            padding: "var(--space-md)",
            minHeight: "48px",
            height: "auto",
            lineHeight: 1.4,
            whiteSpace: "normal",
            border: "1px solid var(--color-rule)",
            background: "var(--color-paper)",
            color: "var(--color-ink)",
          };

          if (isAnswered) {
            if (idx === currentItem.answerIndex) {
              btnStyle.background = "color-mix(in oklab, var(--color-accent) 25%, var(--color-paper))";
              btnStyle.borderColor = "var(--color-forest)";
              btnStyle.fontWeight = 700;
            } else if (idx === selectedOption) {
              btnStyle.background = "color-mix(in oklab, var(--color-error) 15%, var(--color-paper))";
              btnStyle.borderColor = "var(--color-error)";
            }
          }

          return (
            <button
              key={idx}
              type="button"
              className="btn btn--quiet"
              style={btnStyle}
              onClick={() => handleSelectOption(idx)}
              disabled={isAnswered}
            >
              <span style={{ fontFamily: "var(--font-outlier)", marginRight: "var(--space-sm)", color: "var(--color-muted)" }}>
                {String.fromCharCode(65 + idx)}.
              </span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>

      {/* Immediate Explanation */}
      {isAnswered ? (
        <div
          className="well"
          style={{
            marginTop: "var(--space-lg)",
            padding: "var(--space-md) var(--space-lg)",
            border: `1px solid ${selectedOption === currentItem.answerIndex ? "var(--color-forest)" : "var(--color-error)"}`,
            background: selectedOption === currentItem.answerIndex
              ? "color-mix(in oklab, var(--color-forest) 8%, var(--color-paper-3))"
              : "color-mix(in oklab, var(--color-error) 8%, var(--color-paper-3))",
            borderRadius: "var(--radius-card)",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: "var(--text-sm)", marginBottom: "var(--space-3xs)", color: selectedOption === currentItem.answerIndex ? "var(--color-forest)" : "var(--color-error)" }}>
            {selectedOption === currentItem.answerIndex ? "✓ Correct!" : "✗ Incorrect"}
          </div>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-ink-2)", lineHeight: 1.5, margin: 0 }}>
            {currentItem.explanation}
          </p>
        </div>
      ) : null}

      {/* Hint display */}
      {showHint && !isAnswered ? (
        <div className="well" style={{ marginTop: "var(--space-md)", padding: "var(--space-md)", border: "1px solid var(--color-rule)", borderRadius: "var(--radius-card)" }}>
          <strong style={{ fontSize: "var(--text-xs)", color: "var(--color-ink-2)" }}>Hint:</strong>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-ink-2)", marginTop: "var(--space-3xs)" }}>
            {currentItem.hint}
          </p>
        </div>
      ) : null}

      {/* Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "var(--space-xl)", borderTop: "1px solid var(--color-rule)", paddingTop: "var(--space-md)" }}>
        {!isAnswered && !showHint ? (
          <button type="button" className="btn btn--quiet btn--sm" onClick={handleUseHint}>
            Need a hint?
          </button>
        ) : (
          <span />
        )}

        {isAnswered ? (
          <button type="button" className="btn btn--sm" onClick={handleNext} disabled={saving} aria-busy={saving}>
            {saving ? "Evaluating..." : currentIndex + 1 === total ? "Finish Checkpoint" : "Next Question"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
