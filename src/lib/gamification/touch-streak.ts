import { prisma } from "@/lib/prisma";
import { awardXp, XpSource } from "./xp";
import { dayKey, streakAfter, streakXp } from "./streak";

export async function touchStreak(
  userId: string,
  now: Date = new Date(),
): Promise<{ streak: number; xpAwarded: number }> {
  const key = dayKey(now);
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { streakCurrent: true, streakBest: true, lastStreakDay: true, daysActive: true },
  });

  const current = profile ?? { streakCurrent: 0, streakBest: 0, lastStreakDay: null, daysActive: 0 };
  const outcome = streakAfter(current, key);

  let xpAwarded = 0;
  if (outcome.isNewDay) {
    const xp = streakXp(outcome.streakCurrent);
    const award = await awardXp(userId, XpSource.STREAK, key, xp, now);
    xpAwarded = award.awarded;
  }

  await prisma.profile.upsert({
    where: { userId },
    create: {
      userId,
      streakCurrent: outcome.streakCurrent,
      streakBest: outcome.streakBest,
      lastStreakDay: outcome.lastStreakDay,
      daysActive: outcome.daysActive,
    },
    update: {
      streakCurrent: outcome.streakCurrent,
      streakBest: outcome.streakBest,
      lastStreakDay: outcome.lastStreakDay,
      daysActive: outcome.daysActive,
    },
  });

  return { streak: outcome.streakCurrent, xpAwarded };
}
