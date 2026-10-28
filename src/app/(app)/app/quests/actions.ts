"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { awardXp, XpSource } from "@/lib/gamification/xp";
import { awardBadges } from "@/lib/gamification/badges";
import { touchStreak } from "@/lib/gamification/touch-streak";

export interface QuestResult {
  ok: boolean;
  message?: string;
  xpAwarded?: number;
  newBadges?: string[];
}

export async function completeQuest(input: {
  questSlug: string;
  note?: string;
  score?: number;
}): Promise<QuestResult> {
  const session = await requireUser();
  const userId = session.user.id;
  const now = new Date();

  const quest = await prisma.quest.findUnique({
    where: { slug: input.questSlug },
    select: { id: true, slug: true, title: true, xpReward: true, revokedAt: true, expiresAt: true },
  });

  if (!quest) {
    return { ok: false, message: "Quest not found." };
  }

  if (quest.revokedAt !== null || (quest.expiresAt !== null && quest.expiresAt <= now)) {
    return { ok: false, message: "This quest has expired." };
  }

  const existing = await prisma.questCompletion.findUnique({
    where: { userId_questId: { userId, questId: quest.id } },
    select: { id: true },
  });

  if (!existing) {
    await prisma.questCompletion.create({
      data: {
        userId,
        questId: quest.id,
        completedAt: now,
      },
    });
  }

  const award = await awardXp(userId, XpSource.QUEST, quest.slug, quest.xpReward, now);
  const badges = await awardBadges(userId, undefined, now);
  await touchStreak(userId, now);

  revalidatePath("/app/quests");
  revalidatePath(`/app/quests/${quest.slug}`);

  return {
    ok: true,
    xpAwarded: award.awarded,
    newBadges: badges.map((b) => b.title),
    message: award.awarded > 0 ? `Quest completed! +${award.awarded} XP` : "Quest completed!",
  };
}

export async function redeemCodeAction(formData: FormData) {
  const raw = String(formData.get("code") ?? "").trim().toUpperCase();
  if (!raw || raw.length < 5) {
    redirect("/app/quests?error=invalid_code");
  }

  const quest = await prisma.quest.findFirst({
    where: { code: raw },
    select: { slug: true, revokedAt: true, expiresAt: true },
  });

  if (!quest) {
    redirect("/app/quests?error=not_found");
  }

  if (quest.revokedAt !== null || (quest.expiresAt !== null && quest.expiresAt <= new Date())) {
    redirect("/app/quests?error=expired");
  }

  redirect(`/app/quests/${quest.slug}?via=code`);
}
