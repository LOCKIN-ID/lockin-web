import Link from "next/link";
import type { Metadata } from "next";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { levelForXp } from "@/lib/gamification/xp";
import { nextNode } from "@/lib/roadmap";
import { books } from "@/content/books";
import { TaglineStrip } from "@/components/marketing/tagline-strip";

export const metadata: Metadata = {
  title: "Dashboard | LOCK.IN",
  description: "Your daily developer learning headquarters.",
};

export default async function LearnerDashboardPage() {
  const session = await requireUser();
  const userId = session.user.id;

  const [profile, progressCount, completedQuestsCount, next, recentEvents] = await Promise.all([
    prisma.profile.findUnique({
      where: { userId },
      select: { xp: true, streakCurrent: true, streakBest: true },
    }),
    prisma.readingProgress.count({
      where: { userId, completedAt: { not: null } },
    }),
    prisma.questCompletion.count({
      where: { userId },
    }),
    nextNode(userId),
    prisma.xpEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  const xp = profile?.xp ?? 0;
  const streak = profile?.streakCurrent ?? 0;
  const bestStreak = profile?.streakBest ?? 0;
  const level = levelForXp(xp);

  const totalSections = books.reduce((sum, b) => sum + b.chapters.reduce((s, c) => s + c.sections.length, 0), 0);

  return (
    <div className="section">
      <div className="container">
        {/* Welcome & Stats Row */}
        <header className="pagehead" data-reveal="up">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", width: "100%", flexWrap: "wrap", gap: "var(--space-md)" }}>
            <div>
              <h1>Welcome back, <span className="highlight-mint">{session.user.name?.split(" ")[0] ?? "Learner"}</span></h1>
              <p className="lead" style={{ color: "var(--color-ink-2)" }}>
                Level {level} Engineer · Keep momentum high.
              </p>
            </div>

            <div style={{ display: "flex", gap: "var(--space-sm)" }}>
              <Link href="/app/playground" className="btn btn--quiet btn--sm">
                Open Playground
              </Link>
              <Link href="/app/library" className="btn btn--sm">
                Go to Library
              </Link>
            </div>
          </div>
        </header>

        {/* Highlight Stats Banner */}
        {/* Integrated Studio Command Ribbon (Card-free workbench layout) */}
        <div
          data-reveal="up"
          style={{
            marginTop: "var(--space-xl)",
            background: "var(--color-paper-3)",
            border: "1px solid var(--color-rule)",
            borderRadius: "var(--radius-card)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            }}
          >
            {/* Metric 1: Daily Streak */}
            <div
              style={{
                padding: "var(--space-xl)",
                borderRight: "1px solid var(--color-rule)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "var(--space-xs)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--color-ink-2)", fontWeight: 600 }}>
                  Daily streak
                </span>
                <span className="chip" style={{ fontSize: "var(--text-xs)", background: "var(--color-accent)", color: "var(--color-accent-ink)" }}>
                  Active
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-xs)", marginBlock: "var(--space-2xs)" }}>
                <span style={{ fontSize: "var(--text-3xl)", fontWeight: 900, fontFamily: "var(--font-display)", color: "var(--color-forest)" }}>
                  {streak}
                </span>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--color-ink-2)" }}>days</span>
              </div>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
                Personal best: {bestStreak} days
              </span>
            </div>

            {/* Metric 2: Total Experience */}
            <div
              style={{
                padding: "var(--space-xl)",
                borderRight: "1px solid var(--color-rule)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "var(--space-xs)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--color-ink-2)", fontWeight: 600 }}>
                  Experience ledger
                </span>
                <span className="chip" style={{ fontSize: "var(--text-xs)", background: "var(--color-paper-2)" }}>
                  Tier {level}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-xs)", marginBlock: "var(--space-2xs)" }}>
                <span style={{ fontSize: "var(--text-3xl)", fontWeight: 900, fontFamily: "var(--font-display)", color: "var(--color-ink)" }}>
                  {xp}
                </span>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--color-ink-2)" }}>XP</span>
              </div>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
                Level {level} developer status
              </span>
            </div>

            {/* Metric 3: Reading Progress */}
            <div
              style={{
                padding: "var(--space-xl)",
                borderRight: "1px solid var(--color-rule)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "var(--space-xs)",
              }}
            >
              <span style={{ fontSize: "var(--text-sm)", color: "var(--color-ink-2)", fontWeight: 600 }}>
                Reading progress
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-xs)", marginBlock: "var(--space-2xs)" }}>
                <span style={{ fontSize: "var(--text-3xl)", fontWeight: 900, fontFamily: "var(--font-display)" }}>
                  {progressCount}
                </span>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)" }}>/ {totalSections}</span>
              </div>
              <div style={{ height: "4px", background: "var(--color-paper-2)", borderRadius: "var(--radius-pill)", overflow: "hidden" }}>
                <div style={{ width: `${Math.round((progressCount / totalSections) * 100)}%`, height: "100%", background: "var(--color-forest)" }} />
              </div>
            </div>

            {/* Metric 4: Quests Cleared */}
            <div
              style={{
                padding: "var(--space-xl)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "var(--space-xs)",
              }}
            >
              <span style={{ fontSize: "var(--text-sm)", color: "var(--color-ink-2)", fontWeight: 600 }}>
                Quests cleared
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-xs)", marginBlock: "var(--space-2xs)" }}>
                <span style={{ fontSize: "var(--text-3xl)", fontWeight: 900, fontFamily: "var(--font-display)", color: "var(--color-forest)" }}>
                  {completedQuestsCount}
                </span>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--color-ink-2)" }}>milestones</span>
              </div>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
                QR and interactive checkpoints
              </span>
            </div>
          </div>
        </div>

        {/* Studio Learning Horizon */}
        {next ? (
          <div
            data-reveal="plate"
            style={{
              marginTop: "var(--space-2xl)",
              padding: "var(--space-xl) var(--space-2xl)",
              background: "var(--color-paper-2)",
              border: "1px solid var(--color-rule)",
              borderRadius: "var(--radius-card)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "var(--space-lg)",
            }}
          >
            <div style={{ display: "grid", gap: "var(--space-2xs)" }}>
              <h3 style={{ fontSize: "var(--text-xl)", margin: 0 }}>{next.node.title}</h3>
              <p style={{ color: "var(--color-ink-2)", fontSize: "var(--text-sm)", margin: 0, maxWidth: "60ch" }}>
                From {next.bookTitle} · Chapter: {next.chapterTitle}
              </p>
            </div>
            <Link href={`/app/books/${next.bookSlug}`} className="btn">
              Resume Reading
            </Link>
          </div>
        ) : null}

        <div style={{ marginBlock: "var(--space-2xl)" }} data-reveal="up">
          <TaglineStrip
            tone="paper"
            items={["DAILY MOMENTUM ACTIVE", "RUN SNIPPET IN PLAYGROUND", "EARN 25 XP ON CHECKPOINTS", "CONTINUE LEARNING PATH"]}
          />
        </div>

        {/* Two-Column: Quick Links & Recent XP History */}
        <div className="cols-2" data-reveal-group style={{ display: "grid", gap: "var(--space-xl)", marginTop: "var(--space-xl)" }}>
          {/* Recent XP Activity */}
          <div className="panel" data-reveal="left" style={{ padding: "var(--space-xl)", background: "var(--color-paper-3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "var(--space-md)" }}>
              <h3>Recent Milestones</h3>
              <Link href="/app/badges" className="btn btn--quiet btn--sm">
                View Badges
              </Link>
            </div>

            {recentEvents.length === 0 ? (
              <p style={{ color: "var(--color-muted)", fontSize: "var(--text-sm)" }}>
                No XP earned yet today. Open a section in the Beginner book to get started!
              </p>
            ) : (
              <ol style={{ display: "grid", gap: "var(--space-sm)" }}>
                {recentEvents.map((ev) => (
                  <li
                    key={ev.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "var(--space-xs) 0",
                      borderBottom: "1px solid var(--color-rule)",
                      fontSize: "var(--text-sm)",
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600 }}>{ev.source.replace("_", " ")}</span>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", fontFamily: "var(--font-outlier)" }}>
                        {ev.refId}
                      </div>
                    </div>
                    <span style={{ fontFamily: "var(--font-outlier)", fontWeight: 700, color: "var(--color-forest)" }}>
                      +{ev.amount} XP
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* Quick Learning Links */}
          <div data-reveal="right" style={{ display: "grid", gap: "var(--space-md)" }}>
            <div className="panel" style={{ padding: "var(--space-xl)", background: "var(--color-paper-3)" }}>
              <h3>Daily Quests &amp; QR Practice</h3>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-ink-2)", marginBlock: "var(--space-xs)" }}>
                Have a code printed under a QR in your e-book? Redeem it instantly for XP or load the interactive quiz.
              </p>
              <Link href="/app/quests" className="btn btn--sm">
                Open Quests
              </Link>
            </div>

            <div className="panel" style={{ padding: "var(--space-xl)", background: "var(--color-paper-3)" }}>
              <h3>Weekly Leaderboard</h3>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-ink-2)", marginBlock: "var(--space-xs)" }}>
                See where you stand among other engineers locking in their skills this week.
              </p>
              <Link href="/app/leaderboard" className="btn btn--quiet btn--sm">
                View Leaderboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
