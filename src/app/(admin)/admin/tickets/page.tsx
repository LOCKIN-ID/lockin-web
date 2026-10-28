import Link from "next/link";
import type { Metadata } from "next";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Support Tickets Admin | LOCK.IN",
};

async function resolveTicketAction(formData: FormData) {
  "use server";
  await requireAdmin();
  const ticketId = String(formData.get("ticketId") ?? "");
  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status: "resolved",
      closedAt: new Date(),
    },
  });
  revalidatePath("/admin/tickets");
  revalidatePath("/admin");
}

export default async function AdminTicketsPage() {
  await requireAdmin();

  const tickets = await prisma.ticket.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    take: 50,
  });

  return (
    <div className="section">
      <div className="container">
        <header className="pagehead">
          <h1>Customer Support Tickets</h1>
          <p className="lead" style={{ color: "var(--color-ink-2)" }}>
            Review learner issues, respond to tickets, and mark questions resolved.
          </p>
        </header>

        <div className="panel" style={{ marginTop: "var(--space-xl)", overflow: "hidden", background: "var(--color-paper-3)" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Reference &amp; Category</th>
                <th>Learner</th>
                <th>Subject &amp; Latest Message</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "var(--space-xl)", color: "var(--color-muted)" }}>
                    No tickets found.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => {
                  const isResolved = t.status === "resolved" || t.status === "closed";
                  const lastMsg = t.messages[0];

                  return (
                    <tr key={t.id}>
                      <td>
                        <strong style={{ fontFamily: "var(--font-outlier)" }}>{t.id}</strong>
                        <div style={{ fontSize: "var(--text-xs)", textTransform: "capitalize", color: "var(--color-muted)" }}>
                          {t.category}
                        </div>
                      </td>
                      <td>
                        <div>{t.user?.name ?? t.name}</div>
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
                          {t.user?.email ?? t.email}
                        </div>
                      </td>
                      <td>
                        <strong>{t.subject}</strong>
                        {lastMsg ? (
                          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-ink-2)", maxWidth: "400px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {lastMsg.authorName}: {lastMsg.body}
                          </div>
                        ) : null}
                      </td>
                      <td>
                        <span
                          className="chip"
                          style={{
                            fontSize: "var(--text-xs)",
                            background: isResolved ? "var(--color-paper-2)" : "color-mix(in oklab, var(--color-error) 15%, var(--color-paper))",
                            color: isResolved ? "var(--color-muted)" : "var(--color-error)",
                            fontWeight: 700,
                          }}
                        >
                          {t.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "var(--space-xs)" }}>
                          <Link href={`/app/tickets/${t.id}`} className="btn btn--quiet btn--sm" style={{ padding: "0 var(--space-xs)", height: "28px", minHeight: "28px" }}>
                            Reply
                          </Link>
                          {!isResolved ? (
                            <form action={resolveTicketAction}>
                              <input type="hidden" name="ticketId" value={t.id} />
                              <button
                                type="submit"
                                className="btn btn--quiet btn--sm"
                                style={{ padding: "0 var(--space-xs)", height: "28px", minHeight: "28px", color: "var(--color-forest)" }}
                              >
                                Resolve
                              </button>
                            </form>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
