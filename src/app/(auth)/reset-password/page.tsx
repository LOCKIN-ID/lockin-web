"use client";

import { useState } from "react";
import Link from "next/link";

import { authClient } from "@/lib/auth-client";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await (authClient as { forgetPassword?: (opts: { email: string; redirectTo: string }) => Promise<{ error?: { message?: string } }> }).forgetPassword?.({
        email,
        redirectTo: "/login",
      });

      if (res?.error) {
        setError(res.error.message ?? "Could not send reset link.");
        setLoading(false);
        return;
      }

      setSent(true);
      setLoading(false);
    } catch {
      setError("Failed to send reset link. Please check your email and try again.");
      setLoading(false);
    }
  };

  return (
    <div className="panel" style={{ padding: "var(--space-2xl)", background: "var(--color-paper-3)" }}>
      <header style={{ marginBottom: "var(--space-xl)", textAlign: "center" }}>
        <h1 style={{ fontSize: "var(--text-2xl)" }}>Reset your <span className="highlight-mint">password</span></h1>
        <p style={{ color: "var(--color-ink-2)", fontSize: "var(--text-sm)", marginTop: "var(--space-2xs)" }}>
          Enter your registered email and we will send you a recovery link.
        </p>
      </header>

      {sent ? (
        <div style={{ display: "grid", gap: "var(--space-md)", textAlign: "center" }}>
          <div className="well" style={{ padding: "var(--space-md)" }}>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-ink)" }}>
              If an account exists for <strong>{email}</strong>, a password reset email has been queued.
            </p>
          </div>
          <Link href="/login" className="btn btn--sm">
            Back to sign in
          </Link>
        </div>
      ) : (
        <>
          {error ? (
            <div
              className="well"
              style={{
                padding: "var(--space-sm) var(--space-md)",
                border: "1px solid var(--color-error)",
                background: "color-mix(in oklab, var(--color-error) 8%, var(--color-paper-3))",
                color: "var(--color-error)",
                borderRadius: "var(--radius-card)",
                fontSize: "var(--text-sm)",
                marginBottom: "var(--space-lg)",
              }}
              role="alert"
            >
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "var(--space-md)" }}>
            <div className="field">
              <label htmlFor="email" className="label">
                Registered email address
              </label>
              <input
                id="email"
                type="email"
                className="input"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button type="submit" className="btn" disabled={loading} aria-busy={loading}>
              {loading ? "Sending link..." : "Send Reset Link"}
            </button>
          </form>

          <div style={{ marginTop: "var(--space-xl)", textAlign: "center", fontSize: "var(--text-sm)", color: "var(--color-ink-2)" }}>
            Remembered your password?{" "}
            <Link href="/login" style={{ fontWeight: 600 }}>
              Sign in
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
