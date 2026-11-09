/**
 * Page views, counted by the app itself.
 *
 * Cloudflare Web Analytics measures the deployed Worker from the edge; this is the copy
 * the site keeps for itself, so `/admin/analytics` can answer a question with no third
 * party in the path. The rules below are the ones the privacy article promises:
 *
 *   - no cookie and nothing written to the browser;
 *   - the address is never stored. What tells two visitors apart is a one-way value
 *     derived from the address, the browser string and the Jakarta day, re-keyed at every
 *     midnight: the same person on two days is two values that cannot be joined;
 *   - the query string is dropped before a path is stored, and an address never sits
 *     beside a path;
 *   - rows older than `PAGE_VIEW_RETENTION_DAYS` are deleted by the daily retention job.
 */

import { createHmac } from "node:crypto";

import { prisma } from "@/lib/prisma";
import { authSecret } from "@/lib/secret";
import { addDays, dayKey } from "@/lib/gamification/streak";

/** How long a row survives. The retention job enforces it; the privacy article states it. */
export const PAGE_VIEW_RETENTION_DAYS = 90;

/** A path longer than this is not a page this site serves. */
const MAX_PATH = 200;

/** A host longer than this is a tracker's idea of a host, not a link someone followed. */
const MAX_HOST = 120;

/** The same visitor opening the same path twice inside this window is one page view. */
const REPEAT_MS = 30_000;

/** How many recent opens are held in memory to collapse those repeats. */
const REPEAT_MEMORY = 5_000;

/**
 * Who is not a visitor: crawlers, link previews, uptime monitors, and the command-line
 * clients that walk a site. Counting them would make the console a measure of its noise.
 */
const NOT_A_VISITOR =
  /bot|crawl|spider|slurp|headless|monitor|preview|curl|wget|python-requests|node-fetch|axios|facebookexternalhit|whatsapp|telegram/i;

/** The path as it is worth storing: no query string, no fragment, `/`-rooted only. */
export function sanitizePath(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const cut = raw.trim().split(/[?#]/)[0] ?? "";
  if (!cut.startsWith("/") || cut.length > MAX_PATH) return null;
  return cut;
}

/**
 * The host a visit arrived from. Null for a visit that arrived from nowhere (a typed
 * address, a bookmark, an app) and for the site's own pages, which are navigation rather
 * than a source.
 */
export function referrerHost(raw: unknown, siteHost: string | null): string | null {
  if (typeof raw !== "string" || raw.trim() === "") return null;
  let host: string;
  try {
    host = new URL(raw).host;
  } catch {
    return null;
  }
  if (host === "" || host.length > MAX_HOST) return null;
  return host === siteHost ? null : host;
}

/** Whether a request carrying this user agent is a person. */
export function isVisitor(userAgent: string | null): boolean {
  return !!userAgent && userAgent.trim() !== "" && !NOT_A_VISITOR.test(userAgent);
}

/**
 * The value that tells two visitors apart within one Jakarta day: an HMAC of the address
 * and the browser string under the app secret. The address is an input, never a row.
 */
export function visitorKeyFor(input: {
  ip: string | null;
  userAgent: string | null;
  day: string;
  secret: string | null;
}): string | null {
  const { ip, userAgent, day, secret } = input;
  if (!ip || ip === "unknown" || !secret) return null;
  return createHmac("sha256", secret)
    .update(`${ip}|${userAgent ?? ""}|${day}`)
    .digest("hex")
    .slice(0, 32);
}

/** The country the edge reported for a request, when it reported one. */
export function countryOf(headers: Headers): string | null {
  const value = headers.get("cf-ipcountry")?.trim().toUpperCase();
  // `XX` is the edge saying it does not know, which is not a country to write in a table.
  return value && /^[A-Z]{2}$/.test(value) && value !== "XX" ? value : null;
}

/** The Jakarta day keys for the `days` days that end with `endKey`, oldest first. */
export function dayWindow(endKey: string, days: number): string[] {
  const keys: string[] = [];
  for (let back = days - 1; back >= 0; back -= 1) keys.push(addDays(endKey, -back));
  return keys;
}

/**
 * The width a value deserves against the busiest row, as a percentage. A row that happened
 * at all keeps a hairline of bar, so "one visit" never looks like "none".
 */
export function barPercent(value: number, busiest: number): number {
  if (busiest <= 0 || value <= 0) return 0;
  return Math.max(2, Math.round((value / busiest) * 100));
}

export interface PageViewInput {
  path: unknown;
  referrer?: string | null;
  userAgent?: string | null;
  siteHost?: string | null;
  ip?: string | null;
  country?: string | null;
  now?: Date;
}

/** The last path each visitor opened, so an immediate reload is one page view, not two. */
const recent = new Map<string, number>();

function isRepeat(visitorKey: string | null, path: string, now: Date): boolean {
  if (!visitorKey) return false;
  const key = `${visitorKey}|${path}`;
  const at = now.getTime();
  const last = recent.get(key);
  if (last !== undefined && at - last < REPEAT_MS) return true;
  if (recent.size >= REPEAT_MEMORY) recent.clear();
  recent.set(key, at);
  return false;
}

/**
 * Record one page open, and answer whether a row was written. Nothing here throws on a
 * request that is not a page open: it is a request the site declines to count.
 */
export async function recordPageView(input: PageViewInput): Promise<boolean> {
  const path = sanitizePath(input.path);
  const userAgent = input.userAgent ?? null;
  if (!path || !isVisitor(userAgent)) return false;

  const now = input.now ?? new Date();
  const day = dayKey(now);
  const visitorKey = visitorKeyFor({
    ip: input.ip ?? null,
    userAgent,
    day,
    secret: authSecret,
  });
  if (isRepeat(visitorKey, path, now)) return false;

  await prisma.pageView.create({
    data: {
      path,
      dayKey: day,
      referrerHost: referrerHost(input.referrer ?? null, input.siteHost ?? null),
      country: input.country ?? null,
      visitorKey,
    },
  });
  return true;
}

/** Delete the rows the retention promise has run out on. The daily job calls this. */
export async function prunePageViews(now: Date = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - PAGE_VIEW_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const { count } = await prisma.pageView.deleteMany({ where: { createdAt: { lt: cutoff } } });
  return count;
}
