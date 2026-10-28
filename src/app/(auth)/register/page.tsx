"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { signUp } from "@/lib/auth-client";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/app";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    try {
      const res = await signUp.email({
        name,
        email,
        password,
      });

      if (res.error) {
        setError(res.error.message ?? "Registration failed. Please check your details.");
        setLoading(false);
        return;
      }

      router.push(nextPath);
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="panel" style={{ padding: "var(--space-2xl)", background: "var(--color-paper-3)" }}>
      <header style={{ marginBottom: "var(--space-xl)", textAlign: "center" }}>
        <h1 style={{ fontSize: "var(--text-2xl)" }}>Create your <span className="highlight-mint">account</span></h1>
        <p style={{ color: "var(--color-ink-2)", fontSize: "var(--text-sm)", marginTop: "var(--space-2xs)" }}>
          Access the Beginner book and keep your streak alive.
        </p>
      </header>

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
          <label htmlFor="name" className="label">
            Full name
          </label>
          <input
            id="name"
            type="text"
            className="input"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="email" className="label">
            Email address
          </label>
          <input
            id="email"
            type="email"
            className="input"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="password" className="label">
            Password (minimum 8 characters)
          </label>
          <input
            id="password"
            type="password"
            className="input"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit" className="btn" disabled={loading} aria-busy={loading} style={{ marginTop: "var(--space-xs)" }}>
          {loading ? "Creating account..." : "Start Free"}
        </button>
      </form>

      <div style={{ marginTop: "var(--space-xl)", textAlign: "center", fontSize: "var(--text-sm)", color: "var(--color-ink-2)" }}>
        Already have an account?{" "}
        <Link href={`/login${nextPath !== "/app" ? `?next=${encodeURIComponent(nextPath)}` : ""}`} style={{ fontWeight: 600 }}>
          Sign in
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="panel" style={{ padding: "var(--space-2xl)", textAlign: "center" }}>Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
