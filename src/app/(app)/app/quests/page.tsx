import Link from "next/link";
import type { Metadata } from "next";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redeemCodeAction } from "./actions";

export const metadata: Metadata = {
  title: "Quests & QR | LOCK.IN",
  description: "Redeem QR codes from your e-books and complete coding challenges.",
};

interface Props {
  searchParams: Promise<{ error?: string }>;
}

export default async function QuestsPage({ searchParams }: Props) {
  const session = await requireUser();
  const userId = session.user.id;
  const { error } = await searchParams;

  const [quests, completions] = await Promise.all([
    prisma.quest.findMany({
      orderBy: [{ bookSlug: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        slug: true,
        code: true,
        title: true,
        kind: true,
        bookSlug: true,
        xpReward: true,
        revokedAt: true,
        expiresAt: true,
      },
    }),
    prisma.questCompletion.findMany({
      where: { userId },
      select: { questId: true, completedAt: true },
    }),
  ]);

  const completedMap = new Map(completions.map((c) => [c.questId, c.completedAt]));

  return (
    <div className="section">
      <div className="container">
        <header className="pagehead" data-reveal="up">
          <h1>Quests &amp; QR Challenges</h1>
          <p className="lead" style={{ color: "var(--color-ink-2)" }}>
            Scan the printed QR code or enter the code below.
          </p>
        </header>

        {/* Code Entry Panel */}
        <div
          className="panel"
          data-reveal="plate"
          style={{
            marginTop: "var(--space-xl)",
            padding: "var(--space-xl)",
            background: "var(--color-paper-3)",
            maxWidth: "680px",
          }}
        >
          <h3 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-xs)" }}>
            Redeem a Quest Code
          </h3>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-ink-2)", marginBottom: "var(--space-md)" }}>
            Every QR code in the PDF book has a 6-character fallback code printed directly underneath it.
          </p>

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
                marginBottom: "var(--space-md)",
              }}
              role="alert"
            >
              {error === "not_found"
                ? "Code not found. Please double check the 6 characters."
                : error === "expired"
                  ? "This quest has expired or was revoked."
                  : "Invalid code format."}
            </div>
          ) : null}

          <form action={redeemCodeAction} style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap" }}>
            <input
              type="text"
              name="code"
              placeholder="e.g. LCKBEG"
              className="input"
              maxLength={8}
              required
              style={{
                fontFamily: "var(--font-outlier)",
                textTransform: "uppercase",
                maxWidth: "200px",
                letterSpacing: "0.1em",
                fontWeight: 700,
              }}
            />
            <button type="submit" className="btn btn--sm">
              Redeem Code
            </button>
          </form>
        </div>

        {/* Quests Catalog List */}
        <div style={{ marginTop: "var(--space-3xl)" }} data-reveal="up">
          <h2 style={{ marginBottom: "var(--space-lg)" }}>Available <span className="highlight-mint">Quests</span> ({quests.length})</h2>

          <div className="cols-3" data-reveal-group style={{ display: "grid", gap: "var(--space-md)" }}>
            {quests.map((q) => {
              const isCompleted = completedMap.has(q.id);
              const isRevoked = q.revokedAt !== null || (q.expiresAt !== null && q.expiresAt <= new Date());

              return (
                <article
                  key={q.id}
                  className="panel"
                  data-reveal="plate"
                  style={{
                    padding: "var(--space-lg)",
                    background: isCompleted ? "color-mix(in oklab, var(--color-accent) 15%, var(--color-paper))" : "var(--color-paper-3)",
                    border: isCompleted ? "1px solid var(--color-accent)" : "1px solid var(--color-rule)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-xs)" }}>
                      <span className="chip" style={{ fontSize: "var(--text-xs)", textTransform: "capitalize" }}>
                        {q.kind.replace("_", " ")}
                      </span>
                      {isCompleted ? (
                        <span style={{ color: "var(--color-forest)", fontWeight: 700, fontSize: "var(--text-xs)" }}>
                          ✓ Completed
                        </span>
                      ) : isRevoked ? (
                        <span style={{ color: "var(--color-muted)", fontSize: "var(--text-xs)" }}>
                          Expired
                        </span>
                      ) : (
                        <span style={{ fontFamily: "var(--font-outlier)", fontSize: "var(--text-xs)", color: "var(--color-forest)", fontWeight: 700 }}>
                          +{q.xpReward} XP
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: "var(--text-md)", marginBottom: "var(--space-3xs)" }}>
                      {q.title}
                    </h3>
                    <p style={{ fontSize: "var(--text-xs)", color: "var(--color-ink-2)" }}>
                      Book: <code>{q.bookSlug}</code> · Code: <strong>{q.code}</strong>
                    </p>
                  </div>

                  <div style={{ marginTop: "var(--space-md)", paddingTop: "var(--space-xs)", borderTop: "1px solid var(--color-rule)" }}>
                    <Link href={`/app/quests/${q.slug}`} className="btn btn--quiet btn--sm" style={{ width: "100%" }}>
                      {isCompleted ? "Review Quest" : "Start Quest"}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
