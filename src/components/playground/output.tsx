"use client";

import type { ReactNode } from "react";

import type { OutputLine } from "@/lib/playground/runtime-protocol";

export type PanelPhase = "idle" | "booting" | "running" | "done" | "failed";

/**
 * The output area. It is one `role="log"` region, so a screen reader hears each
 * line as it arrives, and every state (idle, booting, running, done, failed)
 * is text the panel actually has, never a spinner standing in for a message.
 */
export function Output({
  lines,
  phase,
  meta,
  idle,
  truncated,
  label,
}: {
  lines: OutputLine[];
  phase: PanelPhase;
  /** The one-line status the panel reports: exit code and duration, or a state. */
  meta: ReactNode;
  idle: string;
  truncated?: boolean;
  label: string;
}) {
  return (
    <div className="console" role="log" aria-live="polite" aria-relevant="additions text" aria-label={label} aria-busy={phase === "booting" || phase === "running"}>
      {lines.length === 0 && phase === "idle" ? <p className="console__meta">{idle}</p> : null}
      {phase === "booting" && lines.length === 0 ? <p className="console__meta">Preparing the Python runtime…</p> : null}
      {lines.map((line, index) => (
        <span key={`${index}-${line.text.slice(0, 12)}`} className="console__line block" data-level={line.level}>
          {line.text}
        </span>
      ))}
      {truncated ? <span className="console__line block" data-level="warn">Output truncated at 200 lines.</span> : null}
      {phase !== "idle" ? <p className="console__meta mt-2">{meta}</p> : null}
    </div>
  );
}
