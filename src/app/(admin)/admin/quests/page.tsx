import Link from "next/link";
import type { Metadata } from "next";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const metadata: Metadata = {
  title: "Quests Admin | LOCK.IN",
};

async function toggleRevokeAction(formData: FormData) {
  "use server";
  await requireAdmin();
  const questId = String(formData.get("questId") ?? "");
  const quest = await prisma.quest.findUnique({ where: { id: questId } });
  if (!quest) return;

  await prisma.quest.update({
    where: { id: questId },
    data: {
      revokedAt: quest.revokedAt ? null : new Date(),
    },
  });

  revalidatePath("/admin/quests");
}

export default async function AdminQuestsPage() {
  await requireAdmin();

  const quests = await prisma.quest.findMany({
    orderBy: [{ bookSlug: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="section">
      <div className="container">
        <header className="pagehead">
          <h1>Quests &amp; QR Codes</h1>
          <p className="lead" style={{ color: "var(--color-ink-2)" }}>
            Inspect printed codes, test redirects, and revoke expired keys.
          </p>
        </header>

        <div className="panel" style={{ marginTop: "var(--space-xl)", overflow: "hidden", background: "var(--color-paper-3)" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Code &amp; Slug</th>
                <th>Title &amp; Book</th>
                <th>Type</th>
                <th>Reward</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quests.map((q) => {
                const isRevoked = Boolean(q.revokedAt);

                return (
                  <tr key={q.id}>
                    <td>
                      <strong style={{ fontFamily: "var(--font-outlier)", letterSpacing: "0.05em" }}>
                        {q.code}
                      </strong>
                      <div style={{ fontFamily: "var(--font-outlier)", fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
                        {q.slug}
                      </div>
                    </td>
                    <td>
                      <strong>{q.title}</strong>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
                        Book: <code>{q.bookSlug}</code>
                      </div>
                    </td>
                    <td style={{ textTransform: "capitalize", fontSize: "var(--text-xs)" }}>
                      {q.kind.replace("_", " ")}
                    </td>
                    <td style={{ fontFamily: "var(--font-outlier)", color: "var(--color-forest)" }}>
                      +{q.xpReward} XP
                    </td>
                    <td>
                      {isRevoked ? (
                        <span className="chip" style={{ background: "color-mix(in oklab, var(--color-error) 20%, var(--color-paper))", color: "var(--color-error)", fontSize: "var(--text-xs)" }}>
                          Revoked (410)
                        </span>
                      ) : (
                        <span className="chip" style={{ background: "color-mix(in oklab, var(--color-accent) 25%, var(--color-paper))", color: "var(--color-forest)", fontSize: "var(--text-xs)" }}>
                          Active
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "var(--space-xs)" }}>
                        <a href={`/q/${q.slug}`} target="_blank" rel="noopener noreferrer" className="btn btn--quiet btn--sm" style={{ padding: "0 var(--space-xs)", height: "28px", minHeight: "28px" }}>
                          Test /q
                        </a>
                        <a href={`/api/qr/${q.slug}`} download={`${q.slug}-qr.svg`} className="btn btn--quiet btn--sm" style={{ padding: "0 var(--space-xs)", height: "28px", minHeight: "28px" }}>
                          QR SVG
                        </a>
                        <form action={toggleRevokeAction}>
                          <input type="hidden" name="questId" value={q.id} />
                          <button
                            type="submit"
                            className="btn btn--quiet btn--sm"
                            style={{
                              padding: "0 var(--space-xs)",
                              height: "28px",
                              minHeight: "28px",
                              color: isRevoked ? "var(--color-forest)" : "var(--color-error)",
                            }}
                          >
                            {isRevoked ? "Restore" : "Revoke"}
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
