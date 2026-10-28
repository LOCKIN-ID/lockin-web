import type { Metadata } from "next";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { drainQueue } from "@/lib/email/queue";

export const metadata: Metadata = {
  title: "Email Queue Admin | LOCK.IN",
};

async function runDrainAction() {
  "use server";
  await requireAdmin();
  await drainQueue(25);
  revalidatePath("/admin/email");
  revalidatePath("/admin");
}

export default async function AdminEmailPage() {
  await requireAdmin();

  const jobs = await prisma.emailJob.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true, name: true } },
    },
    take: 50,
  });

  return (
    <div className="section">
      <div className="container">
        <header className="pagehead">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", width: "100%", flexWrap: "wrap", gap: "var(--space-md)" }}>
            <div>
              <h1>Email Queue &amp; Delivery</h1>
              <p className="lead" style={{ color: "var(--color-ink-2)" }}>
                Auditable retention emails, welcome sequences, and transactional receipts.
              </p>
            </div>

            <form action={runDrainAction}>
              <button type="submit" className="btn btn--sm">
                Run Drain Now
              </button>
            </form>
          </div>
        </header>

        <div className="panel" style={{ marginTop: "var(--space-xl)", overflow: "hidden", background: "var(--color-paper-3)" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Template &amp; Subject</th>
                <th>Recipient</th>
                <th>Scheduled / Sent</th>
                <th>Attempts</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "var(--space-xl)", color: "var(--color-muted)" }}>
                    No email jobs recorded.
                  </td>
                </tr>
              ) : (
                jobs.map((j) => {
                  const isSent = j.status === "sent";
                  const isFailed = j.status === "failed";

                  return (
                    <tr key={j.id}>
                      <td>
                        <strong style={{ fontFamily: "var(--font-outlier)" }}>{j.template}</strong>
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-ink-2)" }}>
                          {j.subject}
                        </div>
                      </td>
                      <td>
                        <div>{j.user.name}</div>
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
                          {j.user.email}
                        </div>
                      </td>
                      <td style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
                        {isSent && j.sentAt ? (
                          <span>Sent: {j.sentAt.toISOString().slice(0, 16).replace("T", " ")}</span>
                        ) : (
                          <span>Sched: {j.scheduledFor.toISOString().slice(0, 16).replace("T", " ")}</span>
                        )}
                      </td>
                      <td style={{ fontFamily: "var(--font-outlier)", fontSize: "var(--text-xs)" }}>
                        {j.attempts} / 5
                      </td>
                      <td>
                        <span
                          className="chip"
                          style={{
                            fontSize: "var(--text-xs)",
                            background: isSent
                              ? "color-mix(in oklab, var(--color-accent) 25%, var(--color-paper))"
                              : isFailed
                                ? "color-mix(in oklab, var(--color-error) 20%, var(--color-paper))"
                                : "var(--color-paper-2)",
                            color: isSent ? "var(--color-forest)" : isFailed ? "var(--color-error)" : undefined,
                            fontWeight: 700,
                          }}
                        >
                          {j.status.toUpperCase()}
                        </span>
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
