"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { signIn } from "@/lib/auth-client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/app";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn.email({
        email,
        password,
      });

      if (res.error) {
        setError(res.error.message ?? "Invalid email or password.");
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
        <h1 style={{ fontSize: "var(--text-2xl)" }}>Welcome <span className="highlight-mint">back</span></h1>
        <p style={{ color: "var(--color-ink-2)", fontSize: "var(--text-sm)", marginTop: "var(--space-2xs)" }}>
          Pick up your reading streak where you left off.
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <label htmlFor="password" className="label">
              Password
            </label>
            <Link
              href="/reset-password"
              style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", textDecoration: "none" }}
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            className="input"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit" className="btn" disabled={loading} aria-busy={loading} style={{ marginTop: "var(--space-xs)" }}>
          {loading ? "Signing in..." : "Sign in to LOCK.IN"}
        </button>
      </form>

      <div style={{ marginTop: "var(--space-xl)", textAlign: "center", fontSize: "var(--text-sm)", color: "var(--color-ink-2)" }}>
        Don&apos;t have an account?{" "}
        <Link href={`/register${nextPath !== "/app" ? `?next=${encodeURIComponent(nextPath)}` : ""}`} style={{ fontWeight: 600 }}>
          Create free account
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="panel" style={{ padding: "var(--space-2xl)", textAlign: "center" }}>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
