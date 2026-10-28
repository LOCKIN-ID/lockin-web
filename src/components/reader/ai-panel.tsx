"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  bookSlug: string;
  chapterId: string;
  sectionId?: string;
  isOpen: boolean;
  onClose: () => void;
  provider?: string | null;
}

export function AiPanel({ bookSlug, chapterId, sectionId, isOpen, onClose, provider = "offline" }: Props) {
  const [messages, setMessages] = useState<Array<{ role: "user" | "coach"; text: string; hintLevel?: number }>>([
    {
      role: "coach",
      text: "I'm your Socratic coach. Tell me what line or concept is giving you trouble, and I'll give you a hint to guide your thinking.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  if (!isOpen) return null;

  const headerLabel =
    mode === "offline" || (mode === null && provider === "offline")
      ? "Offline coach · deterministic hints"
      : `AI Coach (${mode ?? provider})`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona: "tutor",
          message: userText,
          bookSlug,
          chapterId,
          sectionId,
        }),
      });

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "coach", text: "The coach could not answer right now. Review the section keywords or try again." },
        ]);
        setLoading(false);
        return;
      }

      const modeHeader = res.headers.get("X-Tutor-Mode");
      if (modeHeader) setMode(modeHeader);

      const reader = res.body?.getReader();
      if (!reader) {
        setLoading(false);
        return;
      }

      const decoder = new TextDecoder();
      let streamText = "";

      // Placeholder for streaming answer
      setMessages((prev) => [...prev, { role: "coach", text: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const raw = line.slice(6).trim();
            if (!raw) continue;
            try {
              const data = JSON.parse(raw);
              if (data.delta) {
                streamText += data.delta;
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last && last.role === "coach") {
                    last.text = streamText;
                  }
                  return updated;
                });
              }
              if (data.done) {
                if (data.provider) setMode(data.provider);
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "coach", text: "Connection interrupted. Check your network or try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside
      className="drawer-enter"
      aria-label="Socratic AI Coach"
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        bottom: 0,
        width: "100%",
        maxWidth: "460px",
        zIndex: "var(--z-drawer)",
        background: "var(--color-paper-3)",
        borderLeft: "1px solid var(--color-rule)",
        boxShadow: "var(--shadow-overlay)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "var(--space-md) var(--space-lg)",
          borderBottom: "1px solid var(--color-rule)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--color-paper)",
        }}
      >
        <div>
          <h3 style={{ fontSize: "var(--text-md)" }}>Socratic Tutor</h3>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
            {headerLabel}
          </p>
        </div>
        <button
          type="button"
          className="btn btn--quiet btn--sm"
          onClick={onClose}
          aria-label="Close tutor panel"
        >
          ✕
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "var(--space-md)",
          display: "grid",
          gap: "var(--space-md)",
          alignContent: "start",
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              padding: "var(--space-sm) var(--space-md)",
              borderRadius: "var(--radius-card)",
              maxWidth: "88%",
              fontSize: "var(--text-sm)",
              lineHeight: 1.5,
              background: m.role === "user" ? "var(--color-forest)" : "var(--color-paper)",
              color: m.role === "user" ? "var(--color-paper)" : "var(--color-ink)",
              border: m.role === "user" ? "none" : "1px solid var(--color-rule)",
              justifySelf: m.role === "user" ? "end" : "start",
              whiteSpace: "pre-wrap",
            }}
          >
            {m.text}
          </div>
        ))}
        {loading && messages[messages.length - 1]?.role !== "coach" ? (
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", padding: "var(--space-xs)" }}>
            Thinking...
          </div>
        ) : null}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        style={{
          padding: "var(--space-md)",
          borderTop: "1px solid var(--color-rule)",
          background: "var(--color-paper)",
          display: "flex",
          gap: "var(--space-xs)",
        }}
      >
        <input
          type="text"
          className="input"
          placeholder="Ask about a concept or error..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          style={{ minHeight: "40px" }}
        />
        <button type="submit" className="btn btn--sm" disabled={loading || !input.trim()}>
          Ask
        </button>
      </form>
    </aside>
  );
}
