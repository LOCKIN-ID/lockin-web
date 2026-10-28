import Link from "next/link";
import type { Metadata } from "next";

import { requireUser } from "@/lib/auth";
import { topLearners, type LeaderboardScope } from "@/lib/gamification/leaderboard";

export const metadata: Metadata = {
  title: "Leaderboard | LOCK.IN",
  description: "Weekly and all-time developer learning leaderboards.",
};

interface Props {
  searchParams: Promise<{ scope?: string }>;
}

export default async function LeaderboardPage({ searchParams }: Props) {
  const session = await requireUser();
  const { scope = "weekly" } = await searchParams;
  const activeScope: LeaderboardScope = scope === "all" ? "all" : "weekly";

  const board = await topLearners({
    scope: activeScope,
    viewerId: session.user.id,
  });

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: "860px" }}>
        <header className="pagehead" data-reveal="up">
          <h1>Weekly <span className="highlight-mint">Leaderboard</span></h1>
          <p className="lead" style={{ color: "var(--color-ink-2)" }}>
            Competition based on real verified completions and code checkpoints.
          </p>

          <nav className="rail" role="tablist" style={{ marginTop: "var(--space-sm)" }}>
            <Link
              href="/app/leaderboard?scope=weekly"
              className="chip"
              aria-current={activeScope === "weekly" ? "page" : undefined}
            >
              This Week (Mon–Sun)
            </Link>
            <Link
              href="/app/leaderboard?scope=all"
              className="chip"
              aria-current={activeScope === "all" ? "page" : undefined}
            >
              All Time
            </Link>
          </nav>
        </header>

        <div className="panel" data-reveal="plate" style={{ marginTop: "var(--space-xl)", overflow: "hidden", background: "var(--color-paper-3)" }}>
          <div className="tbl__scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: "60px" }}>Rank</th>
                  <th>Developer</th>
                  <th style={{ width: "90px" }}>Level</th>
                  <th className="num" style={{ width: "120px" }}>XP Earned</th>
                </tr>
              </thead>
              <tbody>
                {board.rows.map((row) => {
                  const isViewer = row.isViewer;
                  const isTop3 = row.rank <= 3 && !row.pinned;

                  return (
                    <tr
                      key={row.userId}
                      style={{
                        background: isViewer
                          ? "color-mix(in oklab, var(--color-accent) 22%, var(--color-paper-3))"
                          : row.pinned
                            ? "var(--color-paper-2)"
                            : undefined,
                        fontWeight: isViewer ? 700 : undefined,
                      }}
                    >
                      <td style={{ fontFamily: "var(--font-outlier)" }}>
                        {isTop3 ? (
                          <span title={`Rank ${row.rank}`}>
                            {row.rank === 1 ? "🥇 1" : row.rank === 2 ? "🥈 2" : "🥉 3"}
                          </span>
                        ) : (
                          `#${row.rank}`
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
                          <span>{row.name}</span>
                          {isViewer ? (
                            <span className="chip" style={{ fontSize: "10px", padding: "1px 6px", background: "var(--color-forest)", color: "var(--color-paper)" }}>
                              You
                            </span>
                          ) : null}
                          {row.pinned ? (
                            <span style={{ fontSize: "10px", color: "var(--color-muted)" }}>
                              (outside top 100)
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td style={{ fontFamily: "var(--font-outlier)" }}>
                        Lv. {row.level}
                      </td>
                      <td className="num" style={{ fontFamily: "var(--font-outlier)", color: "var(--color-forest)" }}>
                        {row.xp.toLocaleString()} XP
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
