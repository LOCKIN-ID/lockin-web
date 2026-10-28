"use client";

import { useState } from "react";
import { replyToTicket } from "../actions";

interface Props {
  ticketId: string;
}

export function ReplyForm({ ticketId }: Props) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || pending) return;

    setPending(true);
    setError(null);

    const formData = new FormData();
    formData.append("message", message);

    try {
      const res = await replyToTicket(ticketId, formData);
      if (res.ok) {
        setMessage("");
      } else {
        setError(res.message ?? "Failed to send reply.");
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "var(--space-md)" }}>
      {error ? (
        <div className="well" style={{ padding: "var(--space-sm)", color: "var(--color-error)", fontSize: "var(--text-sm)" }}>
          {error}
        </div>
      ) : null}

      <div className="field">
        <label htmlFor="reply-message" className="label">
          Send a reply:
        </label>
        <textarea
          id="reply-message"
          className="textarea"
          rows={4}
          placeholder="Type your message to support..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
      </div>

      <button type="submit" className="btn btn--sm" disabled={pending || !message.trim()} aria-busy={pending} style={{ width: "fit-content" }}>
        {pending ? "Sending reply..." : "Send Reply"}
      </button>
    </form>
  );
}
