/**
 * The badge evaluator: eleven rules, counted from what actually happened.
 *
 * A badge is never awarded by the action that "should" earn it. Instead the action calls
 * `awardBadges`, this module counts, and any rule that is now true is written once. That is
 * why `/app/badges` can print `4/7` from the same function that decides the award: there is
 * one definition of each condition in the product, and it lives in `src/content/badges.ts`.
 *
 * Awards are idempotent twice over: `UserBadge` is unique on `[userId, badgeId]`, and the
 * XP that comes with it is unique on `[userId, source, refId]` where `refId` is the badge
 * slug. A replayed webhook therefore awards exactly nothing.
 */

import { BADGES, type BadgeRule } from "@/content/badges";
import { books } from "@/content/books";
import { prisma } from "@/lib/prisma";
import { JAKARTA_OFFSET_MS } from "./streak";
import { awardXp, XpSource } from "./xp";

export interface BadgeCounts {
  /** Playground runs that exited cleanly. */
  runs: number;
  /** Languages with at least one clean run. */
  languages: string[];
  /** Reader sections finished. */
  sections: number;
  /** Books whose every section is finished. */
  finishedBooks: number;
  /** Checkpoints answered with every question right. */
  perfectCheckpoints: number;
  /** Quests completed, of any kind. */
  quests: number;
  streak: number;
  level: number;
  /** Whether anything has been run between midnight and 4am Jakarta. */
  nightRun: boolean;
}

const EMPTY_COUNTS: BadgeCounts = {
  runs: 0,
  languages: [],
  sections: 0,
  finishedBooks: 0,
  perfectCheckpoints: 0,
  quests: 0,
  streak: 0,
  level: 1,
  nightRun: false,
};

/** The Jakarta hour of an instant, 0–23. */
export function jakartaHour(date: Date): number {
  return new Date(date.getTime() + JAKARTA_OFFSET_MS).getUTCHours();
}

const SECTION_TOTALS = new Map(
  books.map((book) => [
    book.slug,
    book.chapters.reduce((sum, chapter) => sum + chapter.sections.length, 0),
  ]),
);

/** Every number the rules read, in one round of queries. */
export async function badgeCounts(userId?: string | null): Promise<BadgeCounts> {
  if (!userId) return EMPTY_COUNTS;

  const [okRuns, sectionsByBook, quests, profile] = await Promise.all([
    prisma.playgroundRun.findMany({
      where: { userId, ok: true },
      select: { language: true, createdAt: true },
    }),
    prisma.readingProgress.groupBy({
      by: ["bookSlug"],
      where: { userId, completedAt: { not: null } },
      _count: { _all: true },
    }),
    prisma.questCompletion.count({ where: { userId } }),
    prisma.profile.findUnique({ where: { userId }, select: { streakCurrent: true, level: true } }),
  ]);

  const languages = Array.from(new Set(okRuns.map((run) => run.language)));

  // `score == total` is compared in JS because SQLite cannot compare two columns in a
  // Prisma `where`; the candidate set is small (one row per checkpoint).
  const checkpoints = await prisma.questCompletion.findMany({
    where: { userId, quest: { kind: "checkpoint" }, score: { not: null } },
    select: { score: true, total: true },
  });
  const perfectCheckpoints = checkpoints.filter(
    (row) => row.total !== null && row.total > 0 && row.score === row.total,
  ).length;

  const sections = sectionsByBook.reduce((sum, row) => sum + row._count._all, 0);
  const finishedBooks = sectionsByBook.filter(
    (row) => row._count._all >= (SECTION_TOTALS.get(row.bookSlug) ?? Number.POSITIVE_INFINITY),
  ).length;

  return {
    runs: okRuns.length,
    languages,
    sections,
    finishedBooks,
    perfectCheckpoints,
    quests,
    streak: profile?.streakCurrent ?? 0,
    level: profile?.level ?? 1,
    nightRun: okRuns.some((row) => {
      const hour = jakartaHour(row.createdAt);
      return hour >= 0 && hour < 4;
    }),
  };
}

export interface BadgeProgress {
  have: number;
  need: number;
  /** What is being counted, for the label under the bar. */
  unit: string;
}

/** The real numbers behind a badge, for `/app/badges`. Never a placeholder. */
export function badgeProgress(rule: BadgeRule, counts: BadgeCounts): BadgeProgress {
  switch (rule.kind) {
    case "runs":
      return { have: counts.runs, need: rule.count, unit: "clean runs" };
    case "runs-in-languages":
      return {
        have: rule.languages.filter((language) => counts.languages.includes(language)).length,
        need: rule.languages.length,
        unit: "languages",
      };
    case "sections":
      return { have: counts.sections, need: rule.count, unit: "sections" };
    case "book-sections":
      return { have: counts.finishedBooks, need: rule.books, unit: "books" };
    case "checkpoint-perfect":
      return { have: counts.perfectCheckpoints, need: rule.count, unit: "perfect checkpoints" };
    case "streak":
      return { have: counts.streak, need: rule.days, unit: "days" };
    case "quests":
      return { have: counts.quests, need: rule.count, unit: "quests" };
    case "level":
      return { have: counts.level, need: rule.level, unit: "level" };
    case "night-run":
      return { have: counts.nightRun ? 1 : 0, need: 1, unit: "late run" };
  }
}

export function isEarned(rule: BadgeRule, counts: BadgeCounts): boolean {
  const { have, need } = badgeProgress(rule, counts);
  return have >= need;
}

export interface BadgeAward {
  slug: string;
  title: string;
  xpReward: number;
}

/**
 * Awards everything that is now earned and was not before. Returns just the new ones, so a
 * caller can toast them. Safe to call from anywhere, as often as you like.
 */
export async function awardBadges(
  userId: string,
  counts?: BadgeCounts,
  now: Date = new Date(),
): Promise<BadgeAward[]> {
  const tallies = counts ?? (await badgeCounts(userId));

  const rows = await prisma.badge.findMany({
    where: { slug: { in: BADGES.map((badge) => badge.slug) } },
    select: { id: true, slug: true, title: true, xpReward: true, rule: true, sortOrder: true },
    orderBy: { sortOrder: "asc" },
  });
  const held = new Set(
    (
      await prisma.userBadge.findMany({ where: { userId }, select: { badgeId: true } })
    ).map((row) => row.badgeId),
  );

  const awarded: BadgeAward[] = [];

  for (const row of rows) {
    if (held.has(row.id)) continue;
    const seed = BADGES.find((badge) => badge.slug === row.slug);
    const rule = (row.rule ?? seed?.rule) as BadgeRule | undefined;
    if (!rule || !isEarned(rule, tallies)) continue;

    try {
      await prisma.userBadge.create({ data: { userId, badgeId: row.id, awardedAt: now } });
    } catch {
      // Two requests raced; the unique constraint decided, and the other one awarded it.
      continue;
    }
    const xpReward = row.xpReward || seed?.xpReward || 0;
    if (xpReward > 0) {
      await awardXp(userId, XpSource.BADGE, row.slug, xpReward, now);
    }
    awarded.push({ slug: row.slug, title: row.title, xpReward });
  }

  return awarded;
}

export interface BadgeView extends BadgeAward {
  requirement: string;
  kind: string;
  progress: BadgeProgress;
  earned: boolean;
  awardedAt: Date | null;
}

/** Every badge with its progress and whether it is held, for the badges page and profile. */
export async function badgeViews(userId?: string | null): Promise<BadgeView[]> {
  const counts = await badgeCounts(userId);
  const [rows, heldRows] = await Promise.all([
    prisma.badge.findMany({
      select: { id: true, slug: true, title: true, requirement: true, kind: true, xpReward: true, rule: true, sortOrder: true },
      orderBy: { sortOrder: "asc" },
    }),
    userId
      ? prisma.userBadge.findMany({ where: { userId }, select: { badgeId: true, awardedAt: true } })
      : Promise.resolve([]),
  ]);
  const held = new Map(heldRows.map((row) => [row.badgeId, row.awardedAt]));

  return rows.map((row) => {
    const seed = BADGES.find((badge) => badge.slug === row.slug);
    const rule = (row.rule ?? seed?.rule) as BadgeRule;
    const progress = badgeProgress(rule, counts);
    return {
      slug: row.slug,
      title: row.title,
      requirement: row.requirement,
      kind: row.kind,
      xpReward: row.xpReward,
      progress,
      earned: held.has(row.id) || isEarned(rule, counts),
      awardedAt: held.get(row.id) ?? null,
    };
  });
}
