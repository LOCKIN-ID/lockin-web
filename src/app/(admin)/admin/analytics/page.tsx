import type { Metadata } from "next";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { barPercent, dayWindow, PAGE_VIEW_RETENTION_DAYS } from "@/lib/analytics";
import { count, dayLabel } from "@/lib/format";
import { dayKey } from "@/lib/gamification/streak";

export const metadata: Metadata = {
  title: "Traffic Admin | LOCK.IN",
};

/** The console reads one month of Jakarta days, and prints the last fortnight of them. */
const WINDOW_DAYS = 30;
const SERIES_DAYS = 14;

/** The busiest rows first: `groupBy` counts, this orders, so the query stays one shape. */
function rank<T>(rows: T[], weight: (row: T) => number, take = 8): T[] {
  return [...rows].sort((a, b) => weight(b) - weight(a)).slice(0, take);
}

export default async function AdminTrafficPage() {
  await requireAdmin();

  const today = dayKey(new Date());
  const month = dayWindow(today, WINDOW_DAYS);

  const [byDay, visitorDays, paths, referrers, countries] = await Promise.all([
    prisma.pageView.groupBy({
      by: ["dayKey"],
      where: { dayKey: { in: month } },
      _count: { _all: true },
    }),
    prisma.pageView.groupBy({
      by: ["dayKey", "visitorKey"],
      where: { dayKey: { in: month }, visitorKey: { not: null } },
    }),
    prisma.pageView.groupBy({
      by: ["path"],
      where: { dayKey: { in: month } },
      _count: { _all: true },
    }),
    prisma.pageView.groupBy({
      by: ["referrerHost"],
      where: { dayKey: { in: month }, referrerHost: { not: null } },
      _count: { _all: true },
    }),
    prisma.pageView.groupBy({
      by: ["country"],
      where: { dayKey: { in: month }, country: { not: null } },
      _count: { _all: true },
    }),
  ]);

  const viewsOn = new Map(byDay.map((row) => [row.dayKey, row._count._all]));
  const visitorsOn = new Map<string, number>();
  for (const row of visitorDays) {
    visitorsOn.set(row.dayKey, (visitorsOn.get(row.dayKey) ?? 0) + 1);
  }

  const viewsThisMonth = month.reduce((sum, key) => sum + (viewsOn.get(key) ?? 0), 0);
  const viewsThisWeek = month
    .slice(month.length - 7)
    .reduce((sum, key) => sum + (viewsOn.get(key) ?? 0), 0);

  const series = month.slice(month.length - SERIES_DAYS).map((key) => ({
    key,
    views: viewsOn.get(key) ?? 0,
    visitors: visitorsOn.get(key) ?? 0,
  }));
  const busiest = series.reduce((max, row) => Math.max(max, row.views), 0);

  const topPaths = rank(paths, (row) => row._count._all);
  const topReferrers = rank(referrers, (row) => row._count._all);
  const topCountries = rank(countries, (row) => row._count._all);
  const recorded = viewsThisMonth;

  return (
    <div className="section">
      <div className="container">
        <header className="pagehead">
          <h1>Traffic</h1>
          <p className="lead" style={{ color: "var(--color-ink-2)" }}>
            Every page open this app counted itself, last 30 days.
          </p>
        </header>

        <div
          className="cols-4"
          style={{ display: "grid", gap: "var(--space-md)", marginTop: "var(--space-xl)" }}
        >
          <div className="panel" style={{ padding: "var(--space-lg)", background: "var(--color-paper-3)" }}>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--color-ink-2)", fontWeight: 500 }}>
              Views today
            </span>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 900, marginBlock: "var(--space-3xs)" }}>
              {count(viewsOn.get(today) ?? 0)}
            </div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
              {count(visitorsOn.get(today) ?? 0)} visitors today
            </div>
          </div>

          <div className="panel" style={{ padding: "var(--space-lg)", background: "var(--color-paper-3)" }}>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--color-ink-2)", fontWeight: 500 }}>
              Views, 7 days
            </span>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 900, marginBlock: "var(--space-3xs)" }}>
              {count(viewsThisWeek)}
            </div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
              Jakarta days, today included
            </div>
          </div>

          <div className="panel" style={{ padding: "var(--space-lg)", background: "var(--color-paper-3)" }}>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--color-ink-2)", fontWeight: 500 }}>
              Views, 30 days
            </span>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 900, marginBlock: "var(--space-3xs)" }}>
              {count(recorded)}
            </div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
              {count(topPaths.length)} paths seen
            </div>
          </div>

          <div className="panel" style={{ padding: "var(--space-lg)", background: "var(--color-paper-3)" }}>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--color-ink-2)", fontWeight: 500 }}>
              Sources
            </span>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 900, marginBlock: "var(--space-3xs)" }}>
              {count(topReferrers.length)}
            </div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)" }}>
              {count(topCountries.length)} countries
            </div>
          </div>
        </div>

        {recorded === 0 ? (
          <div className="panel" style={{ marginTop: "var(--space-2xl)", padding: "var(--space-xl)", background: "var(--color-paper-3)" }}>
            <h3>Nothing recorded yet</h3>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-ink-2)", marginTop: "var(--space-xs)" }}>
              The counter is this app&apos;s own, so it starts at zero and needs no setup. Open a
              page in another tab and reload this one: a browser that asks not to be measured,
              and automation, are not counted.
            </p>
          </div>
        ) : null}

        <div className="panel" style={{ marginTop: "var(--space-2xl)", overflow: "hidden", background: "var(--color-paper-3)" }}>
          <table className="tbl">
            <caption>
              A visitor is counted once a day: the value that tells two apart is re-keyed at
              midnight, so one person on two days is two of them. No cookie and no address
              stored; rows live {PAGE_VIEW_RETENTION_DAYS} days, and this console&apos;s own
              reloads are counted too. Days with nothing stay in the table so the shape of the
              fortnight is readable.
            </caption>
            <thead>
              <tr>
                <th>Day</th>
                <th className="num">Views</th>
                <th className="num">Visitors</th>
                <th style={{ width: "40%" }}>Shape</th>
              </tr>
            </thead>
            <tbody>
              {series.map((row) => (
                <tr key={row.key}>
                  <td>
                    {dayLabel(row.key)}
                    {row.key === today ? (
                      <span style={{ color: "var(--color-muted)" }}> &middot; today</span>
                    ) : null}
                  </td>
                  <td className="num">{count(row.views)}</td>
                  <td className="num">{count(row.visitors)}</td>
                  <td>
                    <div
                      aria-hidden="true"
                      style={{
                        height: "6px",
                        borderRadius: "var(--radius-pill)",
                        background: "var(--color-accent)",
                        width: `${barPercent(row.views, busiest)}%`,
                        minWidth: row.views > 0 ? "2px" : "0",
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          className="cols-3"
          style={{ display: "grid", gap: "var(--space-md)", marginTop: "var(--space-2xl)" }}
        >
          <div className="panel" style={{ overflow: "hidden", background: "var(--color-paper-3)" }}>
            <table className="tbl">
              <caption>Paths, 30 days</caption>
              <thead>
                <tr>
                  <th>Path</th>
                  <th className="num">Views</th>
                </tr>
              </thead>
              <tbody>
                {topPaths.length === 0 ? (
                  <tr>
                    <td colSpan={2} style={{ color: "var(--color-muted)" }}>
                      No paths recorded yet.
                    </td>
                  </tr>
                ) : (
                  topPaths.map((row) => (
                    <tr key={row.path}>
                      <td style={{ fontFamily: "var(--font-outlier)" }}>{row.path}</td>
                      <td className="num">{count(row._count._all)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="panel" style={{ overflow: "hidden", background: "var(--color-paper-3)" }}>
            <table className="tbl">
              <caption>Hosts that linked here, 30 days</caption>
              <thead>
                <tr>
                  <th>Source</th>
                  <th className="num">Views</th>
                </tr>
              </thead>
              <tbody>
                {topReferrers.length === 0 ? (
                  <tr>
                    <td colSpan={2} style={{ color: "var(--color-muted)" }}>
                      Nothing arrived from a link yet.
                    </td>
                  </tr>
                ) : (
                  topReferrers.map((row) => (
                    <tr key={row.referrerHost}>
                      <td style={{ fontFamily: "var(--font-outlier)" }}>{row.referrerHost}</td>
                      <td className="num">{count(row._count._all)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="panel" style={{ overflow: "hidden", background: "var(--color-paper-3)" }}>
            <table className="tbl">
              <caption>Countries the edge reported, 30 days</caption>
              <thead>
                <tr>
                  <th>Country</th>
                  <th className="num">Views</th>
                </tr>
              </thead>
              <tbody>
                {topCountries.length === 0 ? (
                  <tr>
                    <td colSpan={2} style={{ color: "var(--color-muted)" }}>
                      No country was reported yet.
                    </td>
                  </tr>
                ) : (
                  topCountries.map((row) => (
                    <tr key={row.country}>
                      <td style={{ fontFamily: "var(--font-outlier)" }}>{row.country}</td>
                      <td className="num">{count(row._count._all)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
