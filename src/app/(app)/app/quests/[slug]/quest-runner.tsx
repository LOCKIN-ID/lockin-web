"use client";

import { useState } from "react";
import Link from "next/link";
import { completeQuest } from "../actions";

interface QuestData {
  slug: string;
  code: string;
  title: string;
  kind: string;
  bookSlug: string;
  xpReward: number;
  payload?: Record<string, unknown>;
}

interface Props {
  quest: QuestData;
  initialCompleted: boolean;
}

export function QuestRunner({ quest, initialCompleted }: Props) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleFinish = async () => {
    if (pending) return;
    setPending(true);
    try {
      const res = await completeQuest({
        questSlug: quest.slug,
        note,
      });

      if (res.ok) {
        setCompleted(true);
        setFeedback(res.message ?? "Quest Completed!");
      } else {
        setFeedback(res.message ?? "Failed to complete.");
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: "var(--space-xl)", maxWidth: "760px", margin: "0 auto" }}>
      <header className="pagehead">
        <div style={{ display: "flex", gap: "var(--space-xs)", alignItems: "center" }}>
          <Link href="/app/quests" className="btn btn--quiet btn--sm">
            &larr; Quests
          </Link>
          <span className="chip" style={{ textTransform: "capitalize" }}>
            {quest.kind.replace("_", " ")}
          </span>
          <span style={{ fontFamily: "var(--font-outlier)", fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
            Code: {quest.code}
          </span>
        </div>

        <h1>{quest.title}</h1>
        <p style={{ color: "var(--color-ink-2)", fontSize: "var(--text-md)" }}>
          Book: <strong>{quest.bookSlug}</strong> · Reward: <strong>+{quest.xpReward} XP</strong>
        </p>

        {completed ? (
          <div
            className="chip"
            style={{
              background: "color-mix(in oklab, var(--color-accent) 25%, var(--color-paper))",
              borderColor: "var(--color-forest)",
              color: "var(--color-forest)",
              fontWeight: 700,
              width: "fit-content",
            }}
          >
            ✓ Quest Completed
          </div>
        ) : null}
      </header>

      {/* Runner specific body */}
      <div className="panel" style={{ padding: "var(--space-2xl)", background: "var(--color-paper-3)" }}>
        {quest.kind === "repo" ? (
          <div style={{ display: "grid", gap: "var(--space-md)" }}>
            <h3>GitHub Starter Repository</h3>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-ink-2)" }}>
              Clone the project repository, follow the README tasks, and implement the feature described in this chapter.
            </p>

            <div className="well" style={{ padding: "var(--space-md)", fontFamily: "var(--font-outlier)", fontSize: "var(--text-sm)" }}>
              <code>git clone https://github.com/lockin-education/{quest.slug}.git</code>
            </div>

            <div className="field" style={{ marginTop: "var(--space-sm)" }}>
              <label htmlFor="repo-note" className="label">
                What did you build or change? (required)
              </label>
              <textarea
                id="repo-note"
                className="textarea"
                rows={3}
                placeholder="e.g. Implemented the responsive grid layout and added the checkout event listener."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={completed}
              />
            </div>

            {!completed ? (
              <button
                type="button"
                className="btn btn--sm"
                onClick={handleFinish}
                disabled={pending || !note.trim()}
                style={{ width: "fit-content" }}
              >
                {pending ? "Submitting..." : "Complete Quest (+10 XP)"}
              </button>
            ) : null}
          </div>
        ) : quest.kind === "bank_soal" ? (
          <div style={{ display: "grid", gap: "var(--space-md)" }}>
            <h3>Bank Soal Practice Set</h3>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-ink-2)" }}>
              Curated drill questions testing core syntax and algorithms for this chapter.
            </p>

            <div className="well" style={{ padding: "var(--space-lg)", display: "grid", gap: "var(--space-sm)" }}>
              <p style={{ fontWeight: 600 }}>Challenge Problem: Implement invariant boundary check</p>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-ink-2)" }}>
                Write a function that accepts an array of orders and filters out expired records before computing total revenue.
              </p>
            </div>

            {!completed ? (
              <button
                type="button"
                className="btn btn--sm"
                onClick={handleFinish}
                disabled={pending}
                style={{ width: "fit-content" }}
              >
                {pending ? "Submitting..." : "Complete Bank Soal (+10 XP)"}
              </button>
            ) : null}
          </div>
        ) : (
          /* Default Quiz / Checkpoint runner */
          <div style={{ display: "grid", gap: "var(--space-md)" }}>
            <h3>Interactive Milestone Check</h3>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-ink-2)" }}>
              Answer the question to verify your comprehension of the concepts introduced in this chapter.
            </p>

            <div className="well" style={{ padding: "var(--space-lg)" }}>
              <p style={{ fontWeight: 600 }}>
                Which runtime guarantees sandbox isolation without needing a remote backend server?
              </p>
              <div style={{ marginTop: "var(--space-sm)", display: "grid", gap: "var(--space-xs)" }}>
                <span className="chip" style={{ background: "var(--color-paper)" }}>
                  WebAssembly (WASI) in-browser engine
                </span>
              </div>
            </div>

            {!completed ? (
              <button
                type="button"
                className="btn btn--sm"
                onClick={handleFinish}
                disabled={pending}
                style={{ width: "fit-content" }}
              >
                {pending ? "Validating..." : `Verify & Clear Quest (+${quest.xpReward} XP)`}
              </button>
            ) : null}
          </div>
        )}

        {feedback ? (
          <div
            className="well"
            style={{
              marginTop: "var(--space-md)",
              padding: "var(--space-sm) var(--space-md)",
              border: "1px solid var(--color-forest)",
              background: "color-mix(in oklab, var(--color-forest) 8%, var(--color-paper-3))",
              borderRadius: "var(--radius-card)",
              fontSize: "var(--text-sm)",
              color: "var(--color-forest)",
            }}
          >
            {feedback}
          </div>
        ) : null}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Link href="/app/quests" className="btn btn--quiet btn--sm">
          All Quests
        </Link>
        <Link href={`/app/books/${quest.bookSlug}`} className="btn btn--quiet btn--sm">
          Open Book
        </Link>
      </div>
    </div>
  );
}
