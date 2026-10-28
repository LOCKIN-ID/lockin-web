import type { ReactNode } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/brand/logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateRows: "auto 1fr auto",
        background: "var(--color-paper)",
      }}
    >
      <header
        style={{
          padding: "var(--space-md) var(--space-xl)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid var(--color-rule)",
        }}
      >
        <Link href="/" aria-label="LOCK.IN home">
          <Wordmark height={26} />
        </Link>
        <Link href="/" className="btn btn--quiet btn--sm">
          &larr; Back to website
        </Link>
      </header>

      <main style={{ display: "grid", placeItems: "center", padding: "var(--space-xl) var(--space-md)" }}>
        <div style={{ width: "100%", maxWidth: "440px" }}>{children}</div>
      </main>

      <footer
        style={{
          padding: "var(--space-md)",
          textAlign: "center",
          fontSize: "var(--text-xs)",
          color: "var(--color-muted)",
          borderTop: "1px solid var(--color-rule)",
        }}
      >
        LOCK.IN &copy; {new Date().getFullYear()} · Short, interactive e-books.
      </footer>
    </div>
  );
}
