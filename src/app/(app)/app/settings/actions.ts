"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function updateEmailPreferences(formData: FormData): Promise<void> {
  const session = await requireUser();
  const userId = session.user.id;

  const tips = formData.get("tips") === "on";
  const streak = formData.get("streakReminder") === "on";
  const digest = formData.get("weeklyDigest") === "on";

  await prisma.emailPreference.upsert({
    where: { userId },
    create: {
      userId,
      tips,
      streak,
      digest,
    },
    update: {
      tips,
      streak,
      digest,
    },
  });

  revalidatePath("/app/settings");
}
