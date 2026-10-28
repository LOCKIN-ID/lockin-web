"use server";

import { revalidatePath } from "next/cache";

import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { XP, XpSource, awardXp } from "@/lib/gamification/xp";
import { dayKey, dayKeyStart } from "@/lib/gamification/streak";
import { fieldErrors, snippetSchema } from "@/lib/validation";

/**
 * Every write the playground can cause. All of them are optional on purpose: the
 * playground is usable signed out, so "no session" is a normal answer, not an error.
 *
 * `recordRun` is the only one called automatically. It stores the language, whether the
 * run succeeded, the error kind and the duration, which is what makes "how long does
 * Pyodide take to boot on a real reader's laptop" an answerable question instead of a
 * guess.
 *
 * The other three are all explicit clicks, because a playground that saves on its own
 * turns every experiment into a row: `saveSnippet` files a copy under a new name,
 * `saveWorkspace` keeps one named row up to date, and `deleteSnippet` removes a row the
 * reader asked to be rid of. Each one is scoped by `userId` in the query itself, so a
 * crafted id can only ever reach the caller's own snippets.
 */

const PLAYGROUND_SOURCES = ["html", "js", "python", "shell"] as const;
type PlaygroundLang = (typeof PLAYGROUND_SOURCES)[number];

function isPlaygroundLang(value: string): value is PlaygroundLang {
  return (PLAYGROUND_SOURCES as readonly string[]).includes(value);
}

export interface RecordRunInput {
  language: string;
  ok: boolean;
  errorKind: string | null;
  durationMs: number;
}

export async function recordRun(input: RecordRunInput): Promise<void> {
  const session = await currentUser();
  if (!session) return;
  if (!isPlaygroundLang(input.language)) return;
  const durationMs = Math.max(0, Math.min(600_000, Math.round(input.durationMs)));

  await prisma.playgroundRun.create({
    data: {
      userId: session.user.id,
      language: input.language,
      ok: input.ok,
      errorKind: input.errorKind,
      durationMs,
    },
  });

  // A run is worth a little XP, but only 10 a day: the playground is practice, not a way
  // to farm the leaderboard. The `refId` names the day and the award slot, so a replayed
  // run cannot mint a second award for the same slot.
  const key = dayKey(new Date());
  if (input.ok) {
    const today = await prisma.playgroundRun.count({
      where: { userId: session.user.id, ok: true, createdAt: { gte: dayKeyStart(key) } },
    });
    const slots = XP.PLAYGROUND_DAILY_CAP / XP.PLAYGROUND;
    if (today <= slots) {
      await awardXp(
        session.user.id,
        XpSource.PLAYGROUND,
        `${key}-${today}`,
        XP.PLAYGROUND,
      );
    }
  }
}

export async function saveWorkspace(input: {
  title: string;
  language: string;
  code: string;
}): Promise<{ ok: boolean; reason?: string }> {
  const session = await currentUser();
  if (!session) return { ok: false, reason: "Sign in to keep a workspace." };
  if (!isPlaygroundLang(input.language)) return { ok: false, reason: "Unknown language." };
  const title = input.title.trim().slice(0, 80) || "Untitled workspace";
  const code = input.code.slice(0, 20_000);
  if (!code.trim()) return { ok: false, reason: "There is nothing to save yet." };

  const existing = await prisma.snippet.findFirst({
    where: { userId: session.user.id, title },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });
  if (existing) {
    await prisma.snippet.update({ where: { id: existing.id }, data: { language: input.language, code } });
  } else {
    await prisma.snippet.create({
      data: { userId: session.user.id, title, language: input.language, code },
    });
  }
  revalidatePath("/app/playground");
  return { ok: true };
}

export interface SnippetResult {
  ok: boolean;
  reason?: string;
  /** The row that was written, so the drawer can name it without a second query. */
  snippet?: { id: string; title: string };
}

/**
 * Files the code as a new snippet. One click, one row: the drawer lists every save, so a
 * reader can keep three attempts at the same exercise side by side and delete the ones
 * that taught them nothing.
 */
export async function saveSnippet(input: {
  title: string;
  language: string;
  code: string;
}): Promise<SnippetResult> {
  const session = await currentUser();
  if (!session) return { ok: false, reason: "Sign in to keep a snippet." };

  const parsed = snippetSchema.safeParse(input);
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    return { ok: false, reason: errors.title ?? errors.language ?? errors.code ?? "That snippet cannot be saved." };
  }

  const row = await prisma.snippet.create({
    data: {
      userId: session.user.id,
      title: parsed.data.title,
      language: parsed.data.language,
      code: parsed.data.code,
    },
    select: { id: true, title: true },
  });

  revalidatePath("/app/playground");
  return { ok: true, snippet: { id: row.id, title: row.title } };
}

/** Removes one of the reader's own snippets. An id that is not theirs deletes nothing. */
export async function deleteSnippet(input: { id: string }): Promise<{ ok: boolean; reason?: string }> {
  const session = await currentUser();
  if (!session) return { ok: false, reason: "Sign in to change your snippets." };

  const id = typeof input.id === "string" ? input.id.trim() : "";
  if (!id) return { ok: false, reason: "That snippet is already gone." };

  const removed = await prisma.snippet.deleteMany({ where: { id, userId: session.user.id } });
  if (removed.count === 0) return { ok: false, reason: "That snippet is not in your library any more." };

  revalidatePath("/app/playground");
  return { ok: true };
}
