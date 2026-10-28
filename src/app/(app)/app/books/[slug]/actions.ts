"use server";

/**
 * The reader's five writers, and the only way book content becomes progress.
 *
 * Everything a reader does in a chapter that outlives the tab goes through here, so
 * there is one definition of what "finished a section" and "passed a checkpoint" mean.
 * Every write is idempotent: the reader can double-click, reload and retry, and the
 * second call records nothing new rather than a second award. That is not a nicety -
 * `XpEvent` is unique on `[userId, source, refId]`, so the same rule that guards the
 * leaderboard also lets these actions be replayed safely.
 *
 * The actions never throw at the reader; they answer with a result object (or a
 * `FormState` for the quest code form) that says what happened in a sentence.
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getBook } from "@/content";
import { requireUser } from "@/lib/auth";
import { runSerial } from "@/lib/db";
import { awardBadges } from "@/lib/gamification/badges";
import { dayKey, streakAfter, streakXp, type StreakState } from "@/lib/gamification/streak";
import { touchStreak } from "@/lib/gamification/touch-streak";
import { awardXp, XP, XpSource } from "@/lib/gamification/xp";
import { prisma } from "@/lib/prisma";
import { fail, fieldErrors, ok, questCodeSchema, slugField, type FormState } from "@/lib/validation";

/** The badge row's public half, as the reader's inline chip needs it. */
export interface NewBadge {
  slug: string;
  title: string;
  xpReward: number;
}

export interface SectionResult {
  ok: boolean;
  /** Everything this call recorded: the section's 5 XP plus the day's first-action streak XP. */
  xpAwarded: number;
  /** The streak after this action. */
  streak: number;
  newBadges: NewBadge[];
  completedAt: string | null;
  /** The first completion, when the reader has already finished this section before. */
  alreadyDone: boolean;
  message?: string;
}

export interface ProgressResult {
  ok: boolean;
  secondsSpent: number;
  message?: string;
}

export interface CheckpointResult {
  ok: boolean;
  passed: boolean;
  score: number;
  total: number;
  hintCount: number;
  xpAwarded: number;
  newBadges: NewBadge[];
  /** The best attempt on record, when the schema has a row to keep it in. */
  best: { score: number; total: number } | null;
  message?: string;
}

export interface BookmarkResult {
  ok: boolean;
  bookmarked: boolean;
  message?: string;
}

/**
 * Content ids are short by design (`b1`, `b1s1`), so `idField`'s six-character floor does
 * not fit them; the real check is that the id exists in the book's content, which happens
 * below.
 */
const contentId = z.string().trim().min(1).max(64);

const sectionInput = z.object({
  bookSlug: slugField,
  chapterId: contentId,
  sectionId: contentId,
});

const progressInput = sectionInput.extend({
  /** One heartbeat is 15 s; the cap is the ceiling for a tab that was throttled. */
  seconds: z.number().int().min(1).max(120),
});

const attemptInput = z.object({
  bookSlug: slugField,
  chapterId: contentId,
  score: z.number().int().min(0).max(200),
  hintCount: z.number().int().min(0).max(200),
});

const bookmarkInput = z.object({
  bookSlug: slugField,
  chapterId: contentId,
  sectionId: contentId,
});


/** Finishes one section: the progress row, 5 XP once, today's streak, then the badges. */
export async function completeSection(input: {
  bookSlug: string;
  chapterId: string;
  sectionId: string;
}): Promise<SectionResult> {
  const session = await requireUser();
  const userId = session.user.id;
  const parsed = sectionInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, xpAwarded: 0, streak: 0, newBadges: [], completedAt: null, alreadyDone: false, message: "That is not a section of any book." };
  }

  const { bookSlug, chapterId, sectionId } = parsed.data;
  const book = getBook(bookSlug);
  const chapter = book?.chapters.find((row) => row.id === chapterId);
  const section = chapter?.sections.find((row) => row.id === sectionId);
  if (!book || !chapter || !section) {
    return { ok: false, xpAwarded: 0, streak: 0, newBadges: [], completedAt: null, alreadyDone: false, message: "That section is not in this book." };
  }

  const now = new Date();
  const key = { userId, bookSlug, chapterId, sectionId };

  // The first completion is the one that counts, so a re-read neither moves the date nor
  // re-awards anything; `awardXp` is what makes the second half of that true.
  const existing = await prisma.readingProgress.findUnique({
    where: { userId_bookSlug_chapterId_sectionId: key },
    select: { completedAt: true },
  });
  const alreadyDone = existing?.completedAt !== null && existing?.completedAt !== undefined;
  const completedAt = existing?.completedAt ?? now;

  const ops: Array<() => Promise<unknown>> = [
    () =>
      prisma.readingProgress.upsert({
        where: { userId_bookSlug_chapterId_sectionId: key },
        create: { ...key, completedAt },
        update: alreadyDone ? {} : { completedAt },
      }),
  ];
  if (!alreadyDone) {
    ops.push(() =>
      prisma.bookmark.upsert({
        where: { userId_bookSlug_chapterId_sectionId: key },
        create: { ...key, note: "" },
        update: {},
      }),
    );
  }
  await runSerial(ops);

  const award = await awardXp(userId, XpSource.SECTION, `${bookSlug}/${chapterId}/${sectionId}`, XP.SECTION, now);
  const streak = await touchStreak(userId, now);
  const badges = await awardBadges(userId, undefined, now);

  revalidatePath(`/app/books/${bookSlug}`);

  return {
    ok: true,
    xpAwarded: award.awarded + streak.xpAwarded,
    streak: streak.streak,
    newBadges: badges.map((badge) => ({ slug: badge.slug, title: badge.title, xpReward: badge.xpReward })),
    completedAt: completedAt.toISOString(),
    alreadyDone,
    message: alreadyDone ? "This section was already ticked." : undefined,
  };
}

/**
 * The 15 s heartbeat. Adding seconds is a write, so it stays a single `upsert` with an
 * `increment`: two tabs open on the same section both count, and neither can clobber the
 * other's total.
 */
export async function saveProgress(input: {
  bookSlug: string;
  chapterId: string;
  sectionId: string;
  seconds: number;
}): Promise<ProgressResult> {
  const session = await requireUser();
  const parsed = progressInput.safeParse(input);
  if (!parsed.success) return { ok: false, secondsSpent: 0, message: "That reading time was not recorded." };

  const { bookSlug, chapterId, sectionId, seconds } = parsed.data;
  const chapter = getBook(bookSlug)?.chapters.find((row) => row.id === chapterId);
  if (!chapter) return { ok: false, secondsSpent: 0, message: "That chapter is not in this book." };
  if (!chapter.sections.some((row) => row.id === sectionId)) {
    return { ok: false, secondsSpent: 0, message: "That section is not in this chapter." };
  }

  const key = { userId: session.user.id, bookSlug, chapterId, sectionId };
  const row = await prisma.readingProgress.upsert({
    where: { userId_bookSlug_chapterId_sectionId: key },
    create: { ...key, secondsSpent: seconds },
    update: { secondsSpent: { increment: seconds } },
    select: { secondsSpent: true },
  });

  return { ok: true, secondsSpent: row.secondsSpent };
}

/** Same rule as `completeSection`, for the dots the reader places while reading. */
export async function toggleBookmark(input: {
  bookSlug: string;
  chapterId: string;
  sectionId: string;
}): Promise<BookmarkResult> {
  const session = await requireUser();
  const parsed = bookmarkInput.safeParse(input);
  if (!parsed.success) return { ok: false, bookmarked: false, message: "That bookmark has no page to sit on." };

  const { bookSlug, chapterId, sectionId } = parsed.data;
  const chapter = getBook(bookSlug)?.chapters.find((row) => row.id === chapterId);
  if (!chapter) return { ok: false, bookmarked: false, message: "That chapter is not in this book." };

  const key = { userId: session.user.id, bookSlug, chapterId, sectionId };
  const existing = await prisma.bookmark.findUnique({
    where: { userId_bookSlug_chapterId_sectionId: key },
    select: { id: true },
  });

  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
    revalidatePath(`/app/books/${bookSlug}`);
    return { ok: true, bookmarked: false };
  }

  await prisma.bookmark.create({ data: { ...key, note: "" } });
  revalidatePath(`/app/books/${bookSlug}`);
  return { ok: true, bookmarked: true };
}

/**
 * A finished checkpoint: the score, the XP once, and the badges.
 *
 * The score is the client's report of its own answers, so the total is taken from the
 * content rather than from the request, and passing is re-decided here against the
 * checkpoint's own `passRatio`. An attempt is kept as a `QuestCompletion` on the chapter's
 * `checkpoint` quest when the catalogue holds one: that is the row `badgeCounts` reads
 * for `clean-checkpoint`, and the only attempt-shaped row this schema has.
 */
export async function saveCheckpointAttempt(input: {
  bookSlug: string;
  chapterId: string;
  score: number;
  hintCount: number;
}): Promise<CheckpointResult> {
  const session = await requireUser();
  const userId = session.user.id;
  const parsed = attemptInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, passed: false, score: 0, total: 0, hintCount: 0, xpAwarded: 0, newBadges: [], best: null, message: "That attempt could not be read." };
  }

  const { bookSlug, chapterId, hintCount } = parsed.data;
  const chapter = getBook(bookSlug)?.chapters.find((row) => row.id === chapterId);
  if (!chapter) {
    return { ok: false, passed: false, score: 0, total: 0, hintCount, xpAwarded: 0, newBadges: [], best: null, message: "That checkpoint is not in this book." };
  }

  const total = chapter.checkpoint.items.length;
  const score = Math.min(parsed.data.score, total);
  const passed = total > 0 && score / total >= chapter.checkpoint.passRatio;
  const now = new Date();

  const quest = await prisma.quest.findFirst({
    where: { bookSlug, chapterId, kind: "checkpoint" },
    select: { id: true },
  });

  let best: { score: number; total: number } | null = null;
  if (quest) {
    const held = await prisma.questCompletion.findUnique({
      where: { userId_questId: { userId, questId: quest.id } },
      select: { score: true, total: true },
    });
    // The best attempt is the one that stays: a retry with a worse score must not erase
    // the pass that earned the XP.
    const better = (held?.score ?? -1) < score;
    const row = await prisma.questCompletion.upsert({
      where: { userId_questId: { userId, questId: quest.id } },
      create: { userId, questId: quest.id, score, total, completedAt: now },
      update: better ? { score, total, completedAt: now } : {},
      select: { score: true, total: true },
    });
    best = { score: row.score ?? score, total: row.total ?? total };
  }

  let xpAwarded = 0;
  if (passed) {
    const award = await awardXp(
      userId,
      XpSource.CHECKPOINT,
      `${bookSlug}/${chapterId}/checkpoint`,
      chapter.checkpoint.xp,
      now,
    );
    xpAwarded = award.awarded;
  }
  const badges = await awardBadges(userId, undefined, now);
  const streak = await touchStreak(userId, now);

  revalidatePath(`/app/books/${bookSlug}`);

  return {
    ok: true,
    passed,
    score,
    total,
    hintCount,
    xpAwarded,
    newBadges: badges.map((badge) => ({ slug: badge.slug, title: badge.title, xpReward: badge.xpReward })),
    best,
    message: passed
      ? hintCount > 0
        ? `Passed with ${hintCount} hint${hintCount === 1 ? "" : "s"} used.`
        : "Passed without a hint."
      : `Pass needs ${Math.ceil(chapter.checkpoint.passRatio * total)} of ${total}.`,
  };
}

/**
 * The printed code from a `questGate` card.
 *
 * A code resolves to exactly one quest in the book it is printed in, and the completion
 * is written once: the XP rides `XpSource.QUEST` with the quest's slug as its refId, which
 * is the same key the quest page uses, so a reader who later opens `/app/quests/<slug>`
 * finds a quest that is already done instead of a second award.
 */
export async function submitQuestCode(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireUser();
  const userId = session.user.id;

  const bookSlug = String(formData.get("bookSlug") ?? "");
  const parsedBook = slugField.safeParse(bookSlug);
  if (!parsedBook.success) return fail("That code came from a book we cannot place.");
  if (!getBook(parsedBook.data)) return fail("That book is not in the catalogue.");

  const parsedCode = questCodeSchema.safeParse({ code: formData.get("code") ?? "" });
  if (!parsedCode.success) {
    return fail("Enter the six characters printed under the QR code.", fieldErrors(parsedCode.error));
  }

  const now = new Date();
  // Codes are stored uppercase and carry no `O`, `0`, `I` or `1`, so folding the typed
  // code to uppercase is the whole of the case-insensitivity the plan asks for.
  const quest = await prisma.quest.findFirst({
    where: { code: parsedCode.data.code.toUpperCase(), bookSlug: parsedBook.data },
    select: { id: true, slug: true, title: true, xpReward: true, revokedAt: true, expiresAt: true },
  });
  if (!quest) return fail("That code is not in this book. Check the six characters under the QR.");

  if (quest.revokedAt !== null || (quest.expiresAt !== null && quest.expiresAt <= now)) {
    return fail("That code expired. Ask your instructor for a new one.");
  }

  const held = await prisma.questCompletion.findUnique({
    where: { userId_questId: { userId, questId: quest.id } },
    select: { id: true },
  });
  if (held) return ok(`${quest.title} is already on your record.`);

  await prisma.questCompletion.create({ data: { userId, questId: quest.id, completedAt: now } });
  const award = await awardXp(userId, XpSource.QUEST, quest.slug, quest.xpReward, now);
  const badges = await awardBadges(userId, undefined, now);
  await touchStreak(userId, now);

  revalidatePath(`/app/books/${parsedBook.data}`);

  const badgeLine = badges.length > 0 ? ` Badge: ${badges.map((badge) => badge.title).join(", ")}.` : "";
  return ok(`${quest.title} is done, worth ${award.awarded} XP.${badgeLine}`);
}
