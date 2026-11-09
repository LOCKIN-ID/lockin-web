import type { ReactNode } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { Wordmark } from "@/components/brand/logo";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--color-paper)" }}>
      {/* Admin Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: "var(--z-sticky-nav)",
          background: "var(--color-paper-3)",
          borderBottom: "1px solid var(--color-rule)",
          padding: "var(--space-sm) var(--space-xl)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "var(--space-md)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xl)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
            <Link href="/admin" aria-label="LOCK.IN Admin">
              <Wordmark height={20} />
            </Link>
            <span className="chip" style={{ background: "var(--color-forest)", color: "var(--color-paper)", fontSize: "10px", padding: "2px 6px" }}>
              Admin Ops
            </span>
          </div>

          <nav aria-label="Admin Navigation" style={{ display: "flex", gap: "var(--space-xs)", alignItems: "center" }}>
            <Link href="/admin" className="chip">Overview</Link>
            <Link href="/admin/analytics" className="chip">Traffic</Link>
            <Link href="/admin/books" className="chip">Books</Link>
            <Link href="/admin/quests" className="chip">Quests</Link>
            <Link href="/admin/orders" className="chip">Orders</Link>
            <Link href="/admin/users" className="chip">Users</Link>
            <Link href="/admin/email" className="chip">Email</Link>
            <Link href="/admin/tickets" className="chip">Tickets</Link>
            <Link href="/admin/help" className="chip">Help Articles</Link>
          </nav>
        </div>

        <div>
          <Link href="/app" className="btn btn--quiet btn--sm">
            &larr; Exit to App
          </Link>
        </div>
      </header>

      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}
