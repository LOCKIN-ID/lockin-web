import { prisma } from "@/lib/prisma";
import { dayKey } from "./streak";

/**
 * XP: what each action is worth, and the only writer that records it.
 *
 * The rule that keeps the leaderboard honest is that XP is awarded *once per thing*:
 * every award carries a `refId` and `XpEvent` is unique on `[userId, source, refId]`, so a
 * replayed request, a double-clicked button and a retried webhook all collapse to one row.
 * `awardXp` returns `{ awarded: 0 }` in that case: a no-op, never an error.
 */

export const XP = {
  SECTION: 5,
  CHECKPOINT: 25,
  QUEST_QUIZ: 15,
  QUEST_OTHER: 10,
  PLAYGROUND: 2,
  PLAYGROUND_DAILY_CAP: 10,
  PURCHASE: 20,
} as const;

/** `XpEvent.source`. Negative or admin-adjusted awards are excluded from the leaderboard. */
export const XpSource = {
  SECTION: "SECTION",
  CHECKPOINT: "CHECKPOINT",
  QUEST: "QUEST",
  PLAYGROUND: "PLAYGROUND",
  STREAK: "STREAK",
  BADGE: "BADGE",
  PURCHASE: "PURCHASE",
  REDEMPTION: "REDEMPTION",
  ADMIN: "ADMIN",
} as const;

export type XpSourceValue = (typeof XpSource)[keyof typeof XpSource];

/** Sources that count towards a leaderboard. Redemptions spend, they do not score. */
export const LEADERBOARD_SOURCES: XpSourceValue[] = [
  XpSource.SECTION,
  XpSource.CHECKPOINT,
  XpSource.QUEST,
  XpSource.PLAYGROUND,
  XpSource.STREAK,
  XpSource.BADGE,
  XpSource.PURCHASE,
  XpSource.ADMIN,
];

/** L1 at 0 XP, L2 at 50, L3 at 200, L4 at 450, L5 at 800. */
export function levelForXp(xp: number): number {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 50)) + 1;
}

/** Total XP at which `level` begins. */
export function xpForLevel(level: number): number {
  return 50 * (level - 1) ** 2;
}

export interface LevelProgress {
  level: number;
  xp: number;
  /** XP earned inside the current level, and the XP the level spans. */
  into: number;
  span: number;
  /** 0–1, for a `scaleX()` bar. Exact 0 at the boundary, never NaN. */
  ratio: number;
  toNext: number;
}

export function levelProgress(xp: number): LevelProgress {
  const safe = Math.max(0, xp);
  const level = levelForXp(safe);
  const floor = xpForLevel(level);
  const ceiling = xpForLevel(level + 1);
  const span = ceiling - floor;
  return {
    level,
    xp: safe,
    into: safe - floor,
    span,
    ratio: span === 0 ? 0 : (safe - floor) / span,
    toNext: Math.max(0, ceiling - safe),
  };
}

export interface AwardResult {
  /** 0 when this award had already been recorded. */
  awarded: number;
  xp: number;
  level: number;
}

/** Records one award. Idempotent on `[userId, source, refId]`; never throws for a repeat. */
export async function awardXp(
  userId: string,
  source: XpSourceValue,
  refId: string,
  amount: number,
  now: Date = new Date(),
): Promise<AwardResult> {
  const key = dayKey(now);
  const existing = await prisma.xpEvent.findUnique({
    where: { userId_source_refId: { userId, source, refId } },
    include: { user: { select: { profile: { select: { xp: true, level: true } } } } },
  });

  if (existing) {
    const xp = existing.user.profile?.xp ?? 0;
    return { awarded: 0, xp, level: levelForXp(xp) };
  }

  await prisma.xpEvent.create({
    data: { userId, source, refId, amount, dayKey: key },
  });
  await prisma.dailyActivity.upsert({
    where: { userId_dayKey: { userId, dayKey: key } },
    create: { userId, dayKey: key, xpEarned: Math.max(0, amount) },
    update: { xpEarned: { increment: Math.max(0, amount) } },
  });

  // The profile may not exist yet for an account created milliseconds ago.
  await prisma.profile.upsert({
    where: { userId },
    create: {
      userId,
      xp: Math.max(0, amount),
      level: levelForXp(Math.max(0, amount)),
    },
    update: { xp: { increment: amount } },
  });

  const profile = await prisma.profile.findUniqueOrThrow({
    where: { userId },
    select: { xp: true, level: true },
  });
  const level = levelForXp(profile.xp);
  if (level !== profile.level) {
    await prisma.profile.update({ where: { userId }, data: { level } });
  }

  return { awarded: amount, xp: profile.xp, level };
}
