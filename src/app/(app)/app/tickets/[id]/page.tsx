import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReplyForm } from "./reply-form";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Ticket ${id} | LOCK.IN Support`,
  };
}

export default async function TicketDetailPage({ params }: Props) {
  const session = await requireUser();
  const userId = session.user.id;
  const { id } = await params;

  const ticket = await prisma.ticket.findFirst({
    where: { id, userId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!ticket) notFound();

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: "780px" }}>
        <header className="pagehead">
          <div style={{ display: "flex", gap: "var(--space-xs)", alignItems: "center" }}>
            <Link href="/app/tickets" className="btn btn--quiet btn--sm">
              &larr; Tickets
            </Link>
            <span className="chip" style={{ fontSize: "var(--text-xs)" }}>
              {ticket.status.toUpperCase()}
            </span>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", fontFamily: "var(--font-outlier)" }}>
              Ref: {ticket.id}
            </span>
          </div>

          <h1>{ticket.subject}</h1>
          <p style={{ color: "var(--color-ink-2)", fontSize: "var(--text-sm)" }}>
            Category: <strong>{ticket.category}</strong> · Opened on {ticket.createdAt.toISOString().slice(0, 10)}
          </p>
        </header>

        {/* Message Thread */}
        <div style={{ display: "grid", gap: "var(--space-md)", marginTop: "var(--space-xl)" }}>
          {ticket.messages.map((m) => {
            const isStaff = m.authorRole === "admin" || m.authorRole === "agent";

            return (
              <div
                key={m.id}
                className="panel"
                style={{
                  padding: "var(--space-xl)",
                  background: isStaff ? "color-mix(in oklab, var(--color-accent) 15%, var(--color-paper-3))" : "var(--color-paper-3)",
                  border: isStaff ? "1px solid var(--color-accent)" : "1px solid var(--color-rule)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "var(--space-xs)" }}>
                  <div style={{ display: "flex", gap: "var(--space-xs)", alignItems: "center" }}>
                    <strong>{m.authorName}</strong>
                    {isStaff ? (
                      <span className="chip" style={{ background: "var(--color-forest)", color: "var(--color-paper)", fontSize: "10px", padding: "1px 6px" }}>
                        Staff
                      </span>
                    ) : null}
                  </div>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
                    {m.createdAt.toISOString().replace("T", " ").slice(0, 16)}
                  </span>
                </div>

                <p style={{ fontSize: "var(--text-sm)", lineHeight: 1.6, whiteSpace: "pre-wrap", margin: 0 }}>
                  {m.body}
                </p>
              </div>
            );
          })}
        </div>

        {/* Reply Form */}
        <div className="panel" style={{ marginTop: "var(--space-xl)", padding: "var(--space-xl)", background: "var(--color-paper-3)" }}>
          <h3 style={{ fontSize: "var(--text-md)", marginBottom: "var(--space-sm)" }}>
            Add a Reply
          </h3>
          <ReplyForm ticketId={ticket.id} />
        </div>
      </div>
    </div>
  );
}
