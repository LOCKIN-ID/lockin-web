"use client";

import { useActionState } from "react";
import Link from "next/link";

import { createTicket, type TicketState } from "@/app/contact/actions";
import { idleState } from "@/lib/validation";

interface Props {
  initialEmail?: string;
  initialName?: string;
}

export function ContactForm({ initialEmail = "", initialName = "" }: Props) {
  const [state, formAction, pending] = useActionState(createTicket, idleState as TicketState);

  if (state.ok && state.ref) {
    return (
      <div
        className="panel"
        style={{
          padding: "var(--space-2xl)",
          background: "var(--color-paper-3)",
          display: "grid",
          gap: "var(--space-md)",
          textAlign: "center",
          placeItems: "center",
        }}
      >
        <h2>We&apos;ve got your message.</h2>
        <p style={{ color: "var(--color-ink-2)", maxWidth: "55ch" }}>
          Your ticket reference code is below. If you were signed in, a confirmation e-mail has been queued.
        </p>

        <div
          style={{
            fontFamily: "var(--font-outlier)",
            fontSize: "var(--text-xl)",
            fontWeight: 800,
            padding: "var(--space-sm) var(--space-xl)",
            background: "var(--color-paper-2)",
            borderRadius: "var(--radius-card)",
            letterSpacing: "0.05em",
            border: "1px solid var(--color-rule)",
          }}
        >
          {state.ref}
        </div>

        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)" }}>
          Keep this code handy. Our team will review your inquiry shortly.
        </p>

        <div style={{ display: "flex", gap: "var(--space-sm)", marginTop: "var(--space-md)" }}>
          <Link href="/help" className="btn btn--quiet btn--sm">
            Visit Help Centre
          </Link>
          <Link href="/" className="btn btn--sm">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} style={{ display: "grid", gap: "var(--space-lg)" }} noValidate>
      {state.message && !state.ok ? (
        <div
          className="well"
          style={{
            padding: "var(--space-md)",
            border: "1px solid var(--color-error)",
            background: "color-mix(in oklab, var(--color-error) 8%, var(--color-paper-3))",
            color: "var(--color-error)",
            borderRadius: "var(--radius-card)",
            fontSize: "var(--text-sm)",
          }}
          role="alert"
        >
          {state.message}
        </div>
      ) : null}

      {/* Honeypot field - visually hidden from users */}
      <div style={{ display: "none" }} aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="cols-2" style={{ display: "grid", gap: "var(--space-md)" }}>
        <div className="field">
          <label htmlFor="name" className="label">
            Your name <span aria-hidden="true">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            className="input"
            defaultValue={initialName}
            required
            aria-invalid={Boolean(state.errors?.name)}
            aria-describedby={state.errors?.name ? "name-error" : undefined}
          />
          {state.errors?.name ? (
            <p id="name-error" className="field__help" data-tone="error">
              {state.errors.name}
            </p>
          ) : null}
        </div>

        <div className="field">
          <label htmlFor="email" className="label">
            Your e-mail address <span aria-hidden="true">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="input"
            defaultValue={initialEmail}
            required
            aria-invalid={Boolean(state.errors?.email)}
            aria-describedby={state.errors?.email ? "email-error" : undefined}
          />
          {state.errors?.email ? (
            <p id="email-error" className="field__help" data-tone="error">
              {state.errors.email}
            </p>
          ) : null}
        </div>
      </div>

      <div className="cols-2" style={{ display: "grid", gap: "var(--space-md)" }}>
        <div className="field">
          <label htmlFor="category" className="label">
            Topic <span aria-hidden="true">*</span>
          </label>
          <select id="category" name="category" className="select" defaultValue="general">
            <option value="general">General inquiry</option>
            <option value="billing">Payments &amp; billing</option>
            <option value="content">Book curriculum &amp; exercises</option>
            <option value="technical">Playground or platform bug</option>
          </select>
          {state.errors?.category ? (
            <p className="field__help" data-tone="error">
              {state.errors.category}
            </p>
          ) : null}
        </div>

        <div className="field">
          <label htmlFor="orderRef" className="label">
            Order ID (optional)
          </label>
          <input
            id="orderRef"
            name="orderRef"
            type="text"
            className="input"
            placeholder="e.g. LOCKIN-..."
            aria-invalid={Boolean(state.errors?.orderRef)}
            aria-describedby={state.errors?.orderRef ? "orderRef-error" : undefined}
          />
          {state.errors?.orderRef ? (
            <p id="orderRef-error" className="field__help" data-tone="error">
              {state.errors.orderRef}
            </p>
          ) : null}
        </div>
      </div>

      <div className="field">
        <label htmlFor="subject" className="label">
          Subject <span aria-hidden="true">*</span>
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          className="input"
          placeholder="Brief summary of your question"
          required
          aria-invalid={Boolean(state.errors?.subject)}
          aria-describedby={state.errors?.subject ? "subject-error" : undefined}
        />
        {state.errors?.subject ? (
          <p id="subject-error" className="field__help" data-tone="error">
            {state.errors.subject}
          </p>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor="message" className="label">
          Detailed message <span aria-hidden="true">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          className="textarea"
          placeholder="What can we help you solve? Please include code snippets or error text if relevant."
          rows={6}
          required
          aria-invalid={Boolean(state.errors?.message)}
          aria-describedby={state.errors?.message ? "message-error" : undefined}
        />
        {state.errors?.message ? (
          <p id="message-error" className="field__help" data-tone="error">
            {state.errors.message}
          </p>
        ) : null}
      </div>

      <div>
        <button type="submit" className="btn" aria-busy={pending} disabled={pending}>
          {pending ? "Sending ticket..." : "Submit Support Ticket"}
        </button>
      </div>
    </form>
  );
}
