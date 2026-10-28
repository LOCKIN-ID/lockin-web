import Link from "next/link";
import type { Metadata } from "next";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Support Tickets | LOCK.IN",
  description: "View and manage your support inquiries.",
};

export default async function UserTicketsPage() {
  const session = await requireUser();
  const userId = session.user.id;

  const tickets = await prisma.ticket.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: "860px" }}>
        <header className="pagehead">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", width: "100%", flexWrap: "wrap", gap: "var(--space-md)" }}>
            <div>
              <h1>My Support Tickets</h1>
              <p className="lead" style={{ color: "var(--color-ink-2)" }}>
                Track responses and communicate with engineering support.
              </p>
            </div>
            <Link href="/contact" className="btn btn--sm">
              Open New Ticket
            </Link>
          </div>
        </header>

        {tickets.length === 0 ? (
          <div
            className="panel"
            style={{
              padding: "var(--space-2xl)",
              textAlign: "center",
              background: "var(--color-paper-3)",
              marginTop: "var(--space-xl)",
              display: "grid",
              gap: "var(--space-sm)",
              placeItems: "center",
            }}
          >
            <h3>No active support tickets</h3>
            <p style={{ color: "var(--color-ink-2)", fontSize: "var(--text-sm)", maxWidth: "45ch" }}>
              Have a question about exercises, runtimes, or billing? Reach out anytime.
            </p>
            <Link href="/contact" className="btn btn--sm">
              Open a Support Ticket
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "var(--space-md)", marginTop: "var(--space-xl)" }}>
            {tickets.map((t) => {
              const lastMsg = t.messages[0];
              const isResolved = t.status === "resolved" || t.status === "closed";

              return (
                <article
                  key={t.id}
                  className="panel"
                  style={{
                    padding: "var(--space-xl)",
                    background: "var(--color-paper-3)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "var(--space-md)",
                  }}
                >
                  <div style={{ display: "grid", gap: "var(--space-2xs)", minWidth: 0 }}>
                    <div style={{ display: "flex", gap: "var(--space-xs)", alignItems: "center" }}>
                      <span
                        className="chip"
                        style={{
                          fontSize: "var(--text-xs)",
                          background: isResolved ? "var(--color-paper-2)" : "color-mix(in oklab, var(--color-accent) 25%, var(--color-paper))",
                          color: isResolved ? "var(--color-muted)" : "var(--color-forest)",
                          fontWeight: 700,
                        }}
                      >
                        {t.status.toUpperCase()}
                      </span>
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", fontFamily: "var(--font-outlier)" }}>
                        {t.id}
                      </span>
                    </div>

                    <h3 style={{ fontSize: "var(--text-lg)" }}>
                      <Link href={`/app/tickets/${t.id}`}>{t.subject}</Link>
                    </h3>

                    {lastMsg ? (
                      <p style={{ fontSize: "var(--text-xs)", color: "var(--color-ink-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        Last message by {lastMsg.authorName}: {lastMsg.body}
                      </p>
                    ) : null}
                  </div>

                  <Link href={`/app/tickets/${t.id}`} className="btn btn--quiet btn--sm">
                    View Thread
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
