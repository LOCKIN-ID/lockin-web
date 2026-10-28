import type { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";

import { addDays, dayKey } from "./streak";
import { LEADERBOARD_SOURCES, levelForXp, XpSource } from "./xp";

/**
 * The weekly and all-time boards.
 *
 * A board is a sum over `XpEvent` rows inside a Jakarta day window, never a read of
 * `Profile.xp`: the weekly board has to stand on its own once last week's rows fall out of
 * range, and a redemption is negative XP, so spending must not buy a place. `Profile` is
 * joined for one thing only: the account's lifetime level, which is what a row prints
 * beside the window's XP.
 *
 * The viewer's own row is always on the board. A leaderboard that quietly omits the person
 * reading it is the one defect every reader notices, so a viewer past the cut is pinned
 * under it rather than dropped, and that pinning rule lives in a pure function the tests
 * can exercise without a database.
 */

/** How many ranked rows a board shows before the viewer's own row is pinned under them. */
export const LEADERBOARD_LIMIT = 100;

/** Rendered for an account that never set a name: never blank, never somebody's e-mail. */
export const ANONYMOUS_NAME = "A reader";

export type LeaderboardScope = "weekly" | "all";

export interface LeaderboardWindow {
  /** Inclusive first Jakarta day, or null when the window has no beginning (all time). */
  from: string | null;
  /** Inclusive last Jakarta day, or null when it has no end. */
  to: string | null;
}

/**
 * The Monday–Sunday week containing `now`, as inclusive Jakarta day keys.
 *
 * `weekStartKey` from `./streak` is deliberately not used: it reads the weekday of the
 * instant rather than of the Jakarta day, so it names the wrong Monday (it answers
 * `2026-10-25` → `2026-10-20` and `2026-10-19` → `2026-10-13`). The weekday below comes
 * from the day key itself, which is the Jakarta calendar day.
 */
export function weeklyWindow(now: Date = new Date()): LeaderboardWindow {
  const today = dayKey(now);
  const weekday = (new Date(`${today}T00:00:00.000Z`).getUTCDay() + 6) % 7; // 0 = Monday
  const from = addDays(today, -weekday);
  return { from, to: addDays(from, 6) };
}

/** All time, said as data: a null bound means "no restriction", not a sentinel date. */
export function allTimeWindow(): LeaderboardWindow {
  return { from: null, to: null };
}

/**
 * The `XpEvent` filter a scope sums, kept as data so the query and the tests agree on the
 * rule. Weekly is written as "not a redemption" because that is the whole rule: every award
 * inside the window counts, and only spending XP takes a place away. All time counts the
 * positive sources, so a redemption can never drag a total below what was earned.
 */
export function boardFilter(
  scope: LeaderboardScope,
  window: LeaderboardWindow,
): Prisma.XpEventWhereInput {
  const filter: Prisma.XpEventWhereInput = {
    source: scope === "weekly" ? { not: XpSource.REDEMPTION } : { in: LEADERBOARD_SOURCES },
  };
  if (window.from !== null && window.to !== null) {
    filter.dayKey = { gte: window.from, lte: window.to };
  }
  return filter;
}

/**
 * What a row prints. Accounts here are e-mail-first, so a `name` that is itself an address
 * is cut at the `@`: a board is a public surface and must never render a whole e-mail -
 * and an account that never set a name reads `A reader` rather than an empty cell.
 */
export function displayName(name: string | null | undefined): string {
  const raw = (name ?? "").trim();
  const local = raw.includes("@") ? raw.slice(0, raw.indexOf("@")).trim() : raw;
  return local.length > 0 ? local : ANONYMOUS_NAME;
}

/** One account's total inside the window, before the order is decided. */
export interface LeaderboardEntry {
  userId: string;
  /** Already display-safe: `displayName` output, never an e-mail. */
  name: string;
  xp: number;
  level: number;
}

export interface LeaderboardRow extends LeaderboardEntry {
  /** Competition rank inside the window: equal XP shares the first of the two ranks. */
  rank: number;
  isViewer: boolean;
  /** True for a row shown after the cut: the viewer's own when they placed below it. */
  pinned: boolean;
}

/**
 * Ranks entries by window XP. Equal XP shares a rank, and a tie is ordered by name then id
 * so the same data always draws the same board.
 */
export function rankRows(entries: LeaderboardEntry[]): LeaderboardRow[] {
  const sorted = [...entries].sort(
    (a, b) => b.xp - a.xp || a.name.localeCompare(b.name) || a.userId.localeCompare(b.userId),
  );

  let rank = 0;
  let previousXp: number | null = null;
  return sorted.map((entry, index) => {
    if (entry.xp !== previousXp) rank = index + 1;
    previousXp = entry.xp;
    return { ...entry, rank, isViewer: false, pinned: false };
  });
}

/**
 * The rows a page draws: the given slice, cut at `limit`, with the viewer's own row kept
 * exactly once. A viewer inside the cut stays where their rank put them; a viewer ranked
 * past the cut is lifted out of the middle and pinned under it, flagged `pinned`. Rows the
 * caller never supplied are never invented: an absent viewer adds nothing.
 */
export function rankedWithViewer(
  rows: LeaderboardRow[],
  viewerId: string,
  limit: number = LEADERBOARD_LIMIT,
): LeaderboardRow[] {
  const seen = new Set<string>();
  const inside: LeaderboardRow[] = [];
  const pinned: LeaderboardRow[] = [];

  for (const row of rows) {
    // The viewer can arrive twice: once inside the slice, once appended by the caller: and
    // a board that prints the same person twice reads as a bug even when the maths is right.
    if (seen.has(row.userId)) continue;
    seen.add(row.userId);

    const flagged: LeaderboardRow = {
      ...row,
      isViewer: row.userId === viewerId,
      pinned: row.rank > limit,
    };
    (flagged.pinned ? pinned : inside).push(flagged);
  }

  return [...inside, ...pinned];
}

export interface LeaderboardInput {
  scope: LeaderboardScope;
  /** How many ranked rows to draw; the viewer's own row is added to whatever this cuts. */
  limit?: number;
  viewerId: string;
}

export interface LeaderboardBoard {
  scope: LeaderboardScope;
  /** The Jakarta day span the XP was summed over; null bounds mean all time. */
  window: LeaderboardWindow;
  /** Rank order, cut to `limit`, with the viewer's own row always somewhere in it. */
  rows: LeaderboardRow[];
}

/**
 * One board for one viewer.
 *
 * Two queries, both keyed on the window: the XP each account earned in it, then the
 * accounts those ids (plus the viewer) name. The viewer is added to the id list so their
 * level still renders in a week they scored nothing in, and ranking happens in JS because
 * the competition ranks and the pinned row have to agree on the same numbers: asking SQL
 * for the order and for the viewer's place would be two different derivations of one rule.
 */
export async function topLearners({
  scope,
  limit = LEADERBOARD_LIMIT,
  viewerId,
}: LeaderboardInput): Promise<LeaderboardBoard> {
  const window = scope === "weekly" ? weeklyWindow() : allTimeWindow();
  // A limit of zero or a fraction would hide every row without saying so.
  const cut = Math.max(1, Math.trunc(limit));

  const groups = await prisma.xpEvent.groupBy({
    by: ["userId"],
    where: boardFilter(scope, window),
    _sum: { amount: true },
  });

  const accounts = await prisma.user.findMany({
    where: { id: { in: [...new Set([...groups.map((group) => group.userId), viewerId])] } },
    select: { id: true, name: true, profile: { select: { level: true } } },
  });
  const accountById = new Map(accounts.map((account) => [account.id, account]));

  const entries: LeaderboardEntry[] = groups.map((group) => {
    const account = accountById.get(group.userId);
    const xp = group._sum.amount ?? 0;
    return {
      userId: group.userId,
      name: displayName(account?.name),
      xp,
      level: account?.profile?.level ?? levelForXp(xp),
    };
  });

  const ranked = rankRows(entries);
  const inBoard = ranked.find((row) => row.userId === viewerId);
  const viewerAccount = accountById.get(viewerId);

  // A viewer with nothing in the window ranks one past every account that scored, which is
  // the same rule `rankRows` applies to the rows that do have XP.
  const viewerRow: LeaderboardRow = inBoard ?? {
    userId: viewerId,
    name: displayName(viewerAccount?.name),
    xp: 0,
    level: viewerAccount?.profile?.level ?? levelForXp(0),
    rank: ranked.filter((row) => row.xp > 0).length + 1,
    isViewer: true,
    pinned: false,
  };

  return {
    scope,
    window,
    rows: rankedWithViewer(inBoard ? ranked : [...ranked, viewerRow], viewerId, cut),
  };
}
