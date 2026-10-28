import type { Metadata } from "next";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { REWARDS } from "@/content/rewards";
import { RedeemButton } from "./redeem-button";

export const metadata: Metadata = {
  title: "XP Rewards & Perks | LOCK.IN",
  description: "Spend your hard-earned XP on cheatsheets, templates, and discount coupons.",
};

export default async function RewardsPage() {
  const session = await requireUser();
  const userId = session.user.id;

  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { xp: true },
  });

  const currentXp = profile?.xp ?? 0;

  return (
    <div className="section">
      <div className="container">
        <header className="pagehead" data-reveal="up">
          <h1>Redeem Your <span className="highlight-mint">Experience</span></h1>
          <p className="lead" style={{ color: "var(--color-ink-2)" }}>
            Turn daily coding streaks into discounts, templates, and permanent study resources.
          </p>

          <div style={{ marginTop: "var(--space-sm)", display: "flex", gap: "var(--space-md)", alignItems: "center" }}>
            <span
              className="chip"
              style={{
                background: "color-mix(in oklab, var(--color-accent) 25%, var(--color-paper))",
                borderColor: "var(--color-forest)",
                fontSize: "var(--text-sm)",
              }}
            >
              Available Balance: <strong style={{ fontFamily: "var(--font-outlier)" }}>{currentXp} XP</strong>
            </span>
          </div>
        </header>

        <div className="cols-3" data-reveal-group style={{ display: "grid", gap: "var(--space-xl)", marginTop: "var(--space-xl)" }}>
          {REWARDS.map((r) => (
            <article
              key={r.slug}
              className="panel"
              data-reveal="plate"
              style={{
                padding: "var(--space-xl)",
                background: "var(--color-paper-3)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-xs)" }}>
                  <span className="chip" style={{ fontSize: "var(--text-xs)", textTransform: "capitalize" }}>
                    {r.kind.replace("_", " ")}
                  </span>
                  <span style={{ fontFamily: "var(--font-outlier)", fontSize: "var(--text-md)", fontWeight: 800, color: "var(--color-forest)" }}>
                    {r.costXp} XP
                  </span>
                </div>

                <h3 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-2xs)" }}>
                  {r.title}
                </h3>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--color-ink-2)", lineHeight: 1.4, marginBottom: "var(--space-md)" }}>
                  {r.description}
                </p>
              </div>

              <div style={{ borderTop: "1px solid var(--color-rule)", paddingTop: "var(--space-md)" }}>
                <RedeemButton rewardSlug={r.slug} costXp={r.costXp} currentXp={currentXp} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
