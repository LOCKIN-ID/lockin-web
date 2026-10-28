import Link from "next/link";
import type { Metadata } from "next";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { priceLabel } from "@/lib/format";
import { paymentProvider } from "@/lib/payments/gateway";

export const metadata: Metadata = {
  title: "Admin Overview | LOCK.IN",
};

export default async function AdminOverviewPage() {
  await requireAdmin();

  const [
    totalUsers,
    orders,
    emailJobs,
    openTickets,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.order.findMany({
      where: { status: "paid" },
      select: { grossAmountIdr: true },
    }),
    prisma.emailJob.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.ticket.count({
      where: { status: "open" },
    }),
  ]);

  const settledRevenue = orders.reduce((sum, o) => sum + o.grossAmountIdr, 0);
  const emailCounts = emailJobs.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = row._count._all;
    return acc;
  }, {});

  const aiProvider = process.env.TUTOR_PROVIDER ?? "offline";
  const paymentsMode = paymentProvider();
  const storageMode = process.env.S3_BUCKET ? "s3" : "local";

  return (
    <div className="section">
      <div className="container">
        <header className="pagehead">
          <h1>System Overview</h1>
          <p className="lead" style={{ color: "var(--color-ink-2)" }}>
            Live platform metrics, queue depths, and operational statuses.
          </p>
        </header>

        {/* System Mode Badges */}
        <div style={{ display: "flex", gap: "var(--space-sm)", marginTop: "var(--space-md)", flexWrap: "wrap" }}>
          <div className="well" style={{ padding: "var(--space-xs) var(--space-md)", fontSize: "var(--text-xs)" }}>
            <strong>AI Tutor:</strong> {aiProvider.toUpperCase()} {aiProvider === "offline" ? "(deterministic ladder)" : ""}
          </div>
          <div className="well" style={{ padding: "var(--space-xs) var(--space-md)", fontSize: "var(--text-xs)" }}>
            <strong>Payments:</strong> {paymentsMode.toUpperCase()} {paymentsMode === "mock" ? "(instant sandbox)" : ""}
          </div>
          <div className="well" style={{ padding: "var(--space-xs) var(--space-md)", fontSize: "var(--text-xs)" }}>
            <strong>Storage:</strong> {storageMode.toUpperCase()}
          </div>
        </div>

        {/* Primary Metrics */}
        <div className="cols-4" style={{ display: "grid", gap: "var(--space-md)", marginTop: "var(--space-xl)" }}>
          <div className="panel" style={{ padding: "var(--space-lg)", background: "var(--color-paper-3)" }}>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--color-ink-2)", fontWeight: 500 }}>
              Settled revenue
            </span>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 900, color: "var(--color-forest)", marginBlock: "var(--space-3xs)" }}>
              {priceLabel(settledRevenue)}
            </div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
              {orders.length} settled orders
            </div>
          </div>

          <div className="panel" style={{ padding: "var(--space-lg)", background: "var(--color-paper-3)" }}>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--color-ink-2)", fontWeight: 500 }}>
              Registered learners
            </span>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 900, marginBlock: "var(--space-3xs)" }}>
              {totalUsers}
            </div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
              Accounts created
            </div>
          </div>

          <div className="panel" style={{ padding: "var(--space-lg)", background: "var(--color-paper-3)" }}>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--color-ink-2)", fontWeight: 500 }}>
              Open tickets
            </span>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 900, color: openTickets > 0 ? "var(--color-error)" : "var(--color-ink)", marginBlock: "var(--space-3xs)" }}>
              {openTickets}
            </div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
              <Link href="/admin/tickets">View support queue</Link>
            </div>
          </div>

          <div className="panel" style={{ padding: "var(--space-lg)", background: "var(--color-paper-3)" }}>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--color-ink-2)", fontWeight: 500 }}>
              Email queue depth
            </span>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 900, marginBlock: "var(--space-3xs)" }}>
              {emailCounts["queued"] ?? 0}
            </div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
              {emailCounts["sent"] ?? 0} sent · {emailCounts["failed"] ?? 0} failed
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="cols-3" style={{ display: "grid", gap: "var(--space-md)", marginTop: "var(--space-2xl)" }}>
          <div className="panel" style={{ padding: "var(--space-xl)", background: "var(--color-paper-3)" }}>
            <h3>Manage E-Books</h3>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-ink-2)", marginBlock: "var(--space-xs)" }}>
              Inspect book catalogue, edit prices, check PDF paths, and trigger QR builds.
            </p>
            <Link href="/admin/books" className="btn btn--quiet btn--sm">
              Books Admin
            </Link>
          </div>

          <div className="panel" style={{ padding: "var(--space-xl)", background: "var(--color-paper-3)" }}>
            <h3>Orders &amp; Receipts</h3>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-ink-2)", marginBlock: "var(--space-xs)" }}>
              Audit raw webhook payloads, mark orders settled, or resend customer receipts.
            </p>
            <Link href="/admin/orders" className="btn btn--quiet btn--sm">
              Orders Admin
            </Link>
          </div>

          <div className="panel" style={{ padding: "var(--space-xl)", background: "var(--color-paper-3)" }}>
            <h3>Email Retention Engine</h3>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-ink-2)", marginBlock: "var(--space-xs)" }}>
              Inspect scheduled email jobs, preview templates, and manually drain queue.
            </p>
            <Link href="/admin/email" className="btn btn--quiet btn--sm">
              Email Queue
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
