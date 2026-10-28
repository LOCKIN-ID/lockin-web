"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { ChatIcon, Send } from "@/components/icons";

/**
 * The support helper: the same coach the reader has, opened with the `support`
 * persona, so its answers are drawn from the help centre instead of a chapter.
 *
 * It talks to `POST /api/ai/tutor` (`text/event-stream`, `data: {"delta"}` frames
 * and a final `data: {"done": true, ...}`) and reads that stream by hand: one
 * `fetch` and a `TextDecoder` are the whole client, so no streaming dependency,
 * no `useEffect`, and nothing that has to be re-implemented to make the panel
 * work without JavaScript.
 *
 * The header never claims a model that is not there. Until an answer names its
 * provider, the label comes from `TUTOR_PROVIDER` as the server sees it; when
 * that is `offline`, the panel says so, because "offline coach" and "an AI" are
 * not the same promise. Every answer ends with the two real escalations: a
 * ticket, and WhatsApp when the deployment configured an address.
 */

const ENDPOINT = "/api/ai/tutor";

/** What the panel says when the endpoint is unreachable, rate-limited or refuses. */
function refusal(status: number): string {
  if (status === 429) {
    return "The helper has answered twenty times this hour for this account. Open a ticket instead: a person will read it.";
  }
  if (status === 413) {
    return "That question was longer than the helper accepts. Send the short version, or put the detail in a ticket.";
  }
  return "The helper is not answering right now. Open a ticket and a person will take it from there.";
}

export interface HelperProps {
  /** `TUTOR_PROVIDER` as the page read it; `null` when the deployment did not set one. */
  provider?: string | null;
  /** The escalations: WhatsApp exists only when `WHATSAPP_SUPPORT_URL` is set. */
  whatsappUrl?: string | null;
  /** The tight variant: the hub and the article page drop the framing paragraph, because the
   *  heading and the line above the panel already say what the coach answers. */
  compact?: boolean;
  /** Which of the page's two actions is the filled one. One primary per view. */
  tone?: "primary" | "quiet";
}

export function Helper({ provider = null, whatsappUrl = null, compact = false, tone = "primary" }: HelperProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState<"idle" | "asking" | "done" | "failed">("idle");
  const [note, setNote] = useState("");
  const [mode, setMode] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [level, setLevel] = useState<number | null>(null);
  const inFlight = useRef<AbortController | null>(null);

  const label =
    mode === "offline" || (mode === null && provider === "offline")
      ? "Offline coach · deterministic hints"
      : mode
        ? `Coach · ${mode}${model ? ` · ${model}` : ""}`
        : "Coach";

  async function ask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = question.trim();
    if (message.length < 2 || status === "asking") return;

    // A second question cancels the first stream; two answers writing into one
    // panel would interleave into a paragraph neither of them wrote.
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;

    setAnswer("");
    setNote("");
    setLevel(null);
    setStatus("asking");

    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ persona: "support", message }),
        signal: controller.signal,
      });

      const headerMode = response.headers.get("X-Tutor-Mode");
      if (headerMode) setMode(headerMode);

      if (!response.ok || !response.body) {
        setStatus("failed");
        setNote(refusal(response.status));
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let text = "";
      let settled = false;

      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const frames = buffer.split("\n\n");
        // The last piece may be half a frame: keep it for the next read.
        buffer = frames.pop() ?? "";

        for (const frame of frames) {
          const line = frame.split("\n").find((candidate) => candidate.startsWith("data:"));
          if (!line) continue;
          const payload = line.slice(5).trim();
          if (!payload) continue;
          let parsed: { delta?: string; done?: boolean; hintLevel?: number; provider?: string; model?: string };
          try {
            parsed = JSON.parse(payload) as typeof parsed;
          } catch {
            continue;
          }
          if (parsed.delta) {
            text += parsed.delta;
            setAnswer(text);
          }
          if (parsed.done) {
            settled = true;
            setMode(parsed.provider ?? headerMode);
            setModel(parsed.model ?? null);
            setLevel(typeof parsed.hintLevel === "number" ? parsed.hintLevel : null);
          }
        }
      }

      if (settled) {
        setStatus("done");
        return;
      }
      setStatus("failed");
      setNote("The answer stopped part-way. Ask again, or open a ticket with the detail.");
    } catch (error) {
      if ((error as { name?: string }).name === "AbortError") return;
      setStatus("failed");
      setNote(refusal(0));
    }
  }

  return (
    <section
      className="panel"
      id="helper"
      aria-labelledby="helper-title"
      style={{ padding: "var(--space-lg)", display: "grid", gap: "var(--space-md)" }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-sm)", alignItems: "baseline", justifyContent: "space-between" }}>
        <h2 id="helper-title" style={{ fontSize: "var(--text-title)", display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
          <ChatIcon size={20} />
          Support helper
        </h2>
        <p style={{ fontSize: "var(--text-xs)", color: "var(--color-ink-2)" }}>{label}</p>
      </div>

      {!compact ? (
        <p style={{ color: "var(--color-ink-2)" }}>
          Ask it about the reader, the playground, an order or an account, and it answers with what
          the help articles say. It is a hint machine, not an oracle: the two ways a person can take
          over are at the bottom of every answer.
        </p>
      ) : null}

      <form onSubmit={ask} style={{ display: "grid", gap: "var(--space-xs)" }}>
        <label className="label" htmlFor="helper-question">
          Your question
        </label>
        <textarea
          className="textarea"
          id="helper-question"
          name="message"
          rows={compact ? 2 : 3}
          maxLength={2000}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Why does the Python tab say ModuleNotFoundError?"
          aria-describedby="helper-question-help"
        />
        <p className="field__help" id="helper-question-help">
          One question at a time is enough. Do not paste a password or a full card number here.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-sm)", alignItems: "center" }}>
          <button
            className={tone === "primary" ? "btn" : "btn btn--quiet"}
            type="submit"
            aria-busy={status === "asking"}
            disabled={status === "asking"}
          >
            <Send size={16} />
            {status === "asking" ? "Thinking…" : "Ask the helper"}
          </button>
          <span className="field__help" role="status">
            {status === "asking"
              ? "Answering…"
              : status === "done"
                ? `${answer.trim().split(/\s+/).filter(Boolean).length} words, level ${level ?? 1} hint.`
                : ""}
          </span>
        </div>
      </form>

      {answer ? (
        <div
          style={{
            display: "grid",
            gap: "var(--space-xs)",
            borderRadius: "var(--radius-card)",
            background: "var(--color-paper-2)",
            padding: "var(--space-md)",
          }}
        >
          <p style={{ whiteSpace: "pre-wrap" }}>{answer}</p>
        </div>
      ) : null}

      {note ? (
        <p className="field__help" data-tone="error" role="status">
          {note}
        </p>
      ) : null}

      {status === "done" ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-sm)", alignItems: "center" }}>
          <Link className={tone === "primary" ? "btn btn--quiet" : "btn"} href="/contact">
            Open a ticket
          </Link>
          {whatsappUrl ? (
            <a className="btn btn--quiet" href={whatsappUrl} target="_blank" rel="noreferrer noopener">
              Chat on WhatsApp
            </a>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
