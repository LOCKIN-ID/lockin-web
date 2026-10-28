import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QuestRunner } from "./quest-runner";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const quest = await prisma.quest.findUnique({
    where: { slug },
    select: { title: true },
  });
  if (!quest) return { title: "Quest Not Found | LOCK.IN" };
  return {
    title: `${quest.title} | Quest · LOCK.IN`,
  };
}

export default async function QuestPage({ params }: Props) {
  const session = await requireUser();
  const { slug } = await params;

  const quest = await prisma.quest.findUnique({
    where: { slug },
  });
  if (!quest) notFound();

  const completion = await prisma.questCompletion.findUnique({
    where: {
      userId_questId: {
        userId: session.user.id,
        questId: quest.id,
      },
    },
  });

  return (
    <div className="section">
      <div className="container">
        <QuestRunner
          quest={{
            slug: quest.slug,
            code: quest.code,
            title: quest.title,
            kind: quest.kind,
            bookSlug: quest.bookSlug,
            xpReward: quest.xpReward,
            payload: typeof quest.payload === "string" ? JSON.parse(quest.payload) : (quest.payload as Record<string, unknown> | undefined),
          }}
          initialCompleted={Boolean(completion)}
        />
      </div>
    </div>
  );
}
