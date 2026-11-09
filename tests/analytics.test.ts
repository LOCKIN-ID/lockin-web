import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { useTestDatabase, type TestDatabase } from "./db";
import {
  barPercent,
  countryOf,
  dayWindow,
  isVisitor,
  recordPageView,
  referrerHost,
  sanitizePath,
  visitorKeyFor,
} from "../src/lib/analytics";

/**
 * The guards around the traffic table, not the table. Every case here is a row that must
 * not be written, or a shape the console would print wrong.
 */

const CHROME =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0 Safari/537.36";

describe("sanitizePath", () => {
  it("keeps the path and drops what would identify the reader", () => {
    expect(sanitizePath("/checkout?order=LOCKIN-8f2a#pay")).toBe("/checkout");
    expect(sanitizePath("  /app/leaderboard  ")).toBe("/app/leaderboard");
  });

  it("refuses what is not a page this site serves", () => {
    expect(sanitizePath("https://example.test/books")).toBeNull();
    expect(sanitizePath("books")).toBeNull();
    expect(sanitizePath(`/${"a".repeat(200)}`)).toBeNull();
    expect(sanitizePath(null)).toBeNull();
  });
});

describe("referrerHost", () => {
  it("keeps the host a visit arrived from", () => {
    expect(referrerHost("https://www.google.com/search?q=lockin", "lockin.id")).toBe(
      "www.google.com",
    );
  });

  it("treats the site's own pages and unusable values as no source", () => {
    expect(referrerHost("https://lockin.id/books", "lockin.id")).toBeNull();
    expect(referrerHost("not a url", null)).toBeNull();
    expect(referrerHost("", null)).toBeNull();
    expect(referrerHost(undefined, null)).toBeNull();
  });
});

describe("isVisitor", () => {
  it("counts a browser", () => {
    expect(isVisitor(CHROME)).toBe(true);
  });

  it("does not count crawlers, monitors or command-line clients", () => {
    expect(isVisitor("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")).toBe(false);
    expect(isVisitor("curl/8.4.0")).toBe(false);
    expect(isVisitor("UptimeRobot/2.0")).toBe(false);
    expect(isVisitor("HeadlessChrome/132.0.0.0")).toBe(false);
    expect(isVisitor("")).toBe(false);
  });
});

describe("visitorKeyFor", () => {
  const ip = "203.0.113.7";
  const secret = "test-secret";

  it("is the same within a day and different on the next one", () => {
    const monday = visitorKeyFor({ ip, userAgent: CHROME, day: "2026-11-09", secret });
    const mondayAgain = visitorKeyFor({ ip, userAgent: CHROME, day: "2026-11-09", secret });
    const tuesday = visitorKeyFor({ ip, userAgent: CHROME, day: "2026-11-10", secret });

    expect(monday).toBe(mondayAgain);
    expect(monday).not.toBe(tuesday);
    expect(monday).toHaveLength(32);
  });

  it("separates two browsers behind one address, and two secrets", () => {
    const chrome = visitorKeyFor({ ip, userAgent: CHROME, day: "2026-11-09", secret });
    const other = visitorKeyFor({ ip, userAgent: "Mozilla/5.0 (iPhone)", day: "2026-11-09", secret });
    const rotated = visitorKeyFor({ ip, userAgent: CHROME, day: "2026-11-09", secret: "other-secret" });

    expect(chrome).not.toBe(other);
    expect(chrome).not.toBe(rotated);
  });

  it("stores nothing when there is no address or no secret to key with", () => {
    expect(visitorKeyFor({ ip: null, userAgent: CHROME, day: "2026-11-09", secret })).toBeNull();
    expect(visitorKeyFor({ ip: "unknown", userAgent: CHROME, day: "2026-11-09", secret })).toBeNull();
    expect(visitorKeyFor({ ip, userAgent: CHROME, day: "2026-11-09", secret: null })).toBeNull();
  });
});

describe("countryOf", () => {
  it("reads the code the edge sends, and refuses anything else", () => {
    expect(countryOf(new Headers({ "cf-ipcountry": "id" }))).toBe("ID");
    expect(countryOf(new Headers({ "cf-ipcountry": "XX" }))).toBeNull();
    expect(countryOf(new Headers({ "cf-ipcountry": "602" }))).toBeNull();
    expect(countryOf(new Headers())).toBeNull();
  });
});

describe("dayWindow", () => {
  it("ends on the given day and walks back over a month boundary", () => {
    expect(dayWindow("2026-03-01", 3)).toEqual(["2026-02-27", "2026-02-28", "2026-03-01"]);
    expect(dayWindow("2026-11-09", 1)).toEqual(["2026-11-09"]);
  });
});

describe("barPercent", () => {
  it("sizes a row against the busiest day", () => {
    expect(barPercent(12, 48)).toBe(25);
    expect(barPercent(48, 48)).toBe(100);
  });

  it("keeps a hairline for a day that happened, and nothing for one that did not", () => {
    expect(barPercent(1, 400)).toBe(2);
    expect(barPercent(0, 400)).toBe(0);
    expect(barPercent(0, 0)).toBe(0);
  });
});

/**
 * The recorder against a real table. What these rows exist to prove is that a stored view
 * carries a visitor key and that a reload does not become a second view: both are things a
 * wrong secret or a missing window would break silently, with the console still rendering.
 */
describe("recordPageView", () => {
  let db: TestDatabase;

  beforeAll(async () => {
    db = await useTestDatabase();
  });
  afterAll(async () => {
    await db.close();
  });

  const open = (path: string, ip: string, now: Date) =>
    recordPageView({
      path,
      ip,
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0 Safari/537.36",
      siteHost: "lockin.test",
      now,
    });

  it("stores a view with a visitor key, dated to the Jakarta day", async () => {
    expect(await open("/books", "203.0.113.10", new Date("2026-11-09T04:00:00.000Z"))).toBe(true);
    const rows = await db.prisma.pageView.findMany({ where: { path: "/books" } });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.visitorKey).toMatch(/^[0-9a-f]{32}$/);
    expect(rows[0]!.dayKey).toBe("2026-11-09");
  });

  it("counts a reload inside the window once, and a second address separately", async () => {
    const now = new Date("2026-11-09T05:00:00.000Z");
    expect(await open("/pricing", "203.0.113.11", now)).toBe(true);
    expect(await open("/pricing", "203.0.113.11", new Date(now.getTime() + 5_000))).toBe(false);
    expect(await open("/pricing", "203.0.113.12", new Date(now.getTime() + 5_000))).toBe(true);

    const rows = await db.prisma.pageView.findMany({ where: { path: "/pricing" } });
    expect(rows).toHaveLength(2);
    expect(new Set(rows.map((row) => row.visitorKey)).size).toBe(2);
  });

  it("drops the query string and refuses what is not a page open", async () => {
    const now = new Date("2026-11-09T06:00:00.000Z");
    expect(await open("/help/privacy?utm_source=deck", "203.0.113.13", now)).toBe(true);
    expect(
      await recordPageView({
        path: "/help/privacy",
        ip: "203.0.113.14",
        userAgent: "curl/8.5.0",
        now,
      }),
    ).toBe(false);

    const rows = await db.prisma.pageView.findMany({ where: { path: "/help/privacy" } });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.referrerHost).toBeNull();
    expect(rows[0]!.country).toBeNull();
  });
});
