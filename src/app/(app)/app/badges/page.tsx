import type { Metadata } from "next";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BADGES } from "@/content/badges";
import { badgeCounts, badgeProgress } from "@/lib/gamification/badges";

export const metadata: Metadata = {
  title: "Badges & Achievements | LOCK.IN",
  description: "Track your engineering progress and unlock achievements.",
};

export default async function BadgesPage() {
  const session = await requireUser();
  const userId = session.user.id;

  const [counts, unlockedBadges] = await Promise.all([
    badgeCounts(userId),
    prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
    }),
  ]);

  const unlockedMap = new Map(unlockedBadges.map((ub) => [ub.badge.slug, ub.awardedAt]));

  return (
    <div className="section">
      <div className="container">
        <header className="pagehead" data-reveal="up">
          <h1>Badges &amp; <span className="highlight-mint">Milestones</span></h1>
          <p className="lead" style={{ color: "var(--color-ink-2)" }}>
            Honest progression metrics. Every badge represents a real milestone, not participation padding.
          </p>

          <div style={{ marginTop: "var(--space-sm)" }}>
            <span className="chip" style={{ background: "var(--color-paper-3)" }}>
              {unlockedBadges.length} / {BADGES.length} Badges Unlocked
            </span>
          </div>
        </header>

        <div className="cols-3" data-reveal-group style={{ display: "grid", gap: "var(--space-lg)", marginTop: "var(--space-xl)" }}>
          {BADGES.map((b) => {
            const unlockedAt = unlockedMap.get(b.slug);
            const isUnlocked = Boolean(unlockedAt);
            const progress = badgeProgress(b.rule, counts);

            return (
              <article
                key={b.slug}
                className="panel"
                data-reveal="plate"
                style={{
                  padding: "var(--space-xl)",
                  background: isUnlocked ? "var(--color-paper-3)" : "var(--color-paper)",
                  borderColor: isUnlocked ? "var(--color-forest)" : "var(--color-rule)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  opacity: isUnlocked ? 1 : 0.75,
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-xs)" }}>
                    <span className="chip" style={{ fontSize: "var(--text-xs)", textTransform: "capitalize" }}>
                      {b.kind}
                    </span>
                    <span style={{ fontFamily: "var(--font-outlier)", fontSize: "var(--text-xs)", color: "var(--color-forest)", fontWeight: 700 }}>
                      +{b.xpReward} XP
                    </span>
                  </div>

                  <h3 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-3xs)", color: isUnlocked ? "var(--color-ink)" : "var(--color-ink-2)" }}>
                    {b.title}
                  </h3>

                  <p style={{ fontSize: "var(--text-sm)", color: "var(--color-ink-2)", lineHeight: 1.4, marginBottom: "var(--space-md)" }}>
                    {b.requirement}
                  </p>
                </div>

                <div style={{ borderTop: "1px solid var(--color-rule)", paddingTop: "var(--space-md)" }}>
                  {isUnlocked ? (
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--color-forest)", fontWeight: 600 }}>
                      ✓ Unlocked on {new Date(unlockedAt!).toISOString().slice(0, 10)}
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: "var(--space-3xs)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-xs)", color: "var(--color-muted)", fontFamily: "var(--font-outlier)" }}>
                        <span>Progress</span>
                        <span>
                          {progress.have} / {progress.need} {progress.unit}
                        </span>
                      </div>
                      <div style={{ height: "6px", background: "var(--color-paper-2)", borderRadius: "var(--radius-pill)", overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${Math.min(100, Math.round((progress.have / progress.need) * 100))}%`,
                            height: "100%",
                            background: "var(--color-muted)",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
