"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { REWARDS } from "@/content/rewards";
import { XpSource } from "@/lib/gamification/xp";
import { dayKey } from "@/lib/gamification/streak";

export async function redeemReward(rewardSlug: string): Promise<{ ok: boolean; code?: string; message: string }> {
  const session = await requireUser();
  const userId = session.user.id;
  const now = new Date();

  const reward = REWARDS.find((r) => r.slug === rewardSlug);
  if (!reward) return { ok: false, message: "Reward not found in catalogue." };

  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { xp: true },
  });

  const currentXp = profile?.xp ?? 0;
  if (currentXp < reward.costXp) {
    return {
      ok: false,
      message: `You need ${reward.costXp} XP to redeem this reward. You currently have ${currentXp} XP.`,
    };
  }

  // Generate unique coupon if coupon kind
  let deliveredCode: string | undefined;
  if (reward.kind === "coupon") {
    const randomSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    deliveredCode = `${reward.value}-${randomSuffix}`;
    const percentOffBps = reward.value.includes("25") ? 2500 : 1000;

    await prisma.coupon.create({
      data: {
        code: deliveredCode,
        percentOffBps,
        appliesTo: "all",
        maxUses: 1,
        active: true,
      },
    });
  }

  // Deduct XP and log redemption
  await prisma.$transaction([
    prisma.xpEvent.create({
      data: {
        userId,
        source: XpSource.REDEMPTION,
        refId: `${reward.slug}-${now.getTime()}`,
        amount: -reward.costXp,
        dayKey: dayKey(now),
      },
    }),
    prisma.profile.update({
      where: { userId },
      data: { xp: { decrement: reward.costXp } },
    }),
  ]);

  revalidatePath("/app/rewards");
  revalidatePath("/app");

  return {
    ok: true,
    code: deliveredCode,
    message: deliveredCode
      ? `Redeemed! Use coupon code: ${deliveredCode}`
      : "Reward redeemed successfully!",
  };
}
