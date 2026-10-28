/**
 * The mail queue: one row per message, drained by a scheduled job.
 *
 * The product must be able to send a tip three days from now without a long-lived process,
 * so a mail is a database row with a `scheduledFor` and a `dedupeKey`. `enqueue` is
 * idempotent on `[userId, template, dedupeKey]`: calling the registration hook twice
 * queues one welcome mail, and the Monday digest cannot be sent twice in a week because
 * the week's key is the same.
 *
 * `drainQueue` owns the whole failure story: 5 attempts then `failed`, a preference that
 * is off becomes `skipped` with the reason stored where `/admin/email` can show it, and a
 * transport error never stops the rest of the batch.
 */

import { prisma } from "@/lib/prisma";
import { addDays, dayKey, dayKeyStart, previousDayKey, weekStartKey } from "@/lib/gamification/streak";
import { nextNode } from "@/lib/roadmap";
import { renderTemplate, TEMPLATE_PREFERENCE, type PreferenceKey, type TemplateId } from "./templates";
import { sendMail } from "./transport";

const MAX_ATTEMPTS = 5;

export interface EnqueueOptions {
  subject: string;
  payload?: Record<string, unknown>;
  /** When it becomes eligible. Defaults to now. */
  scheduledFor?: Date;
  /** The idempotency key: same user + template + key means same mail. */
  dedupeKey: string;
}

export async function enqueue(
  userId: string,
  template: TemplateId,
  { subject, payload = {}, scheduledFor = new Date(), dedupeKey }: EnqueueOptions,
): Promise<{ queued: boolean; id?: string }> {
  const existing = await prisma.emailJob.findUnique({
    where: { userId_template_dedupeKey: { userId, template, dedupeKey } },
    select: { id: true },
  });
  if (existing) return { queued: false, id: existing.id };

  const job = await prisma.emailJob.create({
    data: {
      userId,
      template,
      subject,
      payloadJson: payload as object,
      status: "queued",
      scheduledFor,
      dedupeKey,
    },
    select: { id: true },
  });
  return { queued: true, id: job.id };
}

/** The welcome mail now, then the three tips at +1, +3 and +7 days. */
export async function enqueueWelcomeSequence(userId: string, now: Date = new Date()): Promise<number> {
  const plan: Array<{ template: TemplateId; days: number; subject: string }> = [
    { template: "welcome", days: 0, subject: "Welcome to LOCK.IN" },
    { template: "tip_day_1", days: 1, subject: "Read the last line of the error first" },
    { template: "tip_day_3", days: 3, subject: "XP is paid once per thing, on purpose" },
    { template: "tip_day_7", days: 7, subject: "The playground's honest limits" },
  ];

  let queued = 0;
  for (const step of plan) {
    const result = await enqueue(userId, step.template, {
      subject: step.subject,
      payload: { name: "", userId },
      scheduledFor: new Date(now.getTime() + step.days * 86_400_000),
      dedupeKey: "reg",
    });
    if (result.queued) queued += 1;
  }
  return queued;
}

/**
 * The instance that a "sent at 19:00 Jakarta" reminder is scheduled for on `dayKey`.
 * Jakarta is a fixed +7, so this is the shift `dayKey` uses, inverted.
 */
export function reminderInstant(key: string, hour = 19): Date {
  return new Date(dayKeyStart(key).getTime() + hour * 3_600_000);
}

/**
 * Queues what the schedule owes right now: the streak reminder for anyone whose streak is
 * still alive but who has not practised today, and the weekly digest on the Monday run.
 * Both are idempotent, so a run every two minutes is the same as a run once a day.
 */
export async function enqueueScheduled(now: Date = new Date()): Promise<{ queued: number }> {
  const today = dayKey(now);
  const yesterday = previousDayKey(today);
  const due = reminderInstant(today);
  const afterDeadline = now.getTime() >= due.getTime();
  let queued = 0;

  // A streak of two or more is worth protecting; a one-day streak is not a streak yet.
  const remindable = await prisma.profile.findMany({
    where: {
      streakCurrent: { gte: 2 },
      lastStreakDay: yesterday,
      user: { emailPreference: { is: { OR: [{ streak: true }], unsubscribedAt: null } } },
    },
    select: {
      userId: true,
      streakCurrent: true,
      user: { select: { email: true, name: true } },
    },
  });

  for (const profile of remindable) {
    const result = await enqueue(profile.userId, "streak_reminder", {
      subject: `Your ${profile.streakCurrent}-day streak is still open today`,
      payload: {
        name: profile.user.name ?? "",
        userId: profile.userId,
        streak: profile.streakCurrent,
      },
      scheduledFor: afterDeadline ? now : due,
      dedupeKey: today,
    });
    if (result.queued) queued += 1;
  }

  const weekStart = weekStartKey(today);
  const isMonday = weekStart === today;

  if (isMonday) {
    const weekAgo = new Date(now.getTime() - 7 * 86_400_000);
    const active = await prisma.profile.findMany({
      where: {
        user: {
          xpEvents: { some: { createdAt: { gte: weekAgo } } },
          emailPreference: { is: { OR: [{ digest: true }], unsubscribedAt: null } },
        },
      },
      select: { userId: true, user: { select: { name: true } } },
    });

    for (const profile of active) {
      const [sum, sections, badges, node] = await Promise.all([
        prisma.xpEvent.aggregate({ where: { userId: profile.userId, createdAt: { gte: weekAgo } }, _sum: { amount: true } }),
        prisma.readingProgress.count({ where: { userId: profile.userId, completedAt: { gte: weekAgo } } }),
        prisma.userBadge.count({ where: { userId: profile.userId, awardedAt: { gte: weekAgo } } }),
        nextNode(profile.userId),
      ]);

      const result = await enqueue(profile.userId, "weekly_digest", {
        subject: `Your week: ${sum._sum.amount ?? 0} XP, ${sections} sections`,
        payload: {
          name: profile.user.name ?? "",
          userId: profile.userId,
          xp: sum._sum.amount ?? 0,
          sections,
          badges,
          nextTitle: node?.node.title ?? "",
          nextHref: node ? `${process.env.APP_URL ?? "http://localhost:3000"}/app/books/${node.bookSlug}` : "",
        },
        scheduledFor: now,
        dedupeKey: weekStart,
      });
      if (result.queued) queued += 1;
    }
  }

  return { queued };
}

interface DrainResult {
  sent: number;
  failed: number;
  skipped: number;
  remaining: number;
}

/** Sends what is due. Returns counts, never throws for one bad message. */
export async function drainQueue(limit = 25, now: Date = new Date()): Promise<DrainResult> {
  const jobs = await prisma.emailJob.findMany({
    where: { status: "queued", scheduledFor: { lte: now } },
    orderBy: { scheduledFor: "asc" },
    take: limit,
    select: {
      id: true,
      userId: true,
      template: true,
      payloadJson: true,
      attempts: true,
      user: {
        select: {
          email: true,
          name: true,
          emailPreference: {
            select: { tips: true, streak: true, product: true, digest: true, unsubscribedAt: true },
          },
        },
      },
    },
  });

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const job of jobs) {
    const template = job.template as TemplateId;
    const preference: PreferenceKey | null = TEMPLATE_PREFERENCE[template] ?? null;
    const prefs = job.user.emailPreference;
    // A missing preference row means the column defaults, which are all on; the row only
    // ever exists to say no.
    const optedOut =
      preference !== null && prefs
        ? prefs.unsubscribedAt !== null || prefs[preference] === false
        : false;

    if (optedOut) {
      await prisma.emailJob.update({
        where: { id: job.id },
        data: { status: "skipped", lastError: `skipped: ${preference} mail is off` },
      });
      skipped += 1;
      continue;
    }

    const payload = {
      ...(job.payloadJson as Record<string, unknown>),
      userId: job.userId,
      name: (job.payloadJson as Record<string, unknown>).name || job.user.name || "",
    };

    let rendered;
    try {
      rendered = renderTemplate(template, payload);
    } catch (cause) {
      await prisma.emailJob.update({
        where: { id: job.id },
        data: {
          status: job.attempts + 1 >= MAX_ATTEMPTS ? "failed" : "queued",
          attempts: job.attempts + 1,
          lastError: `render: ${(cause as Error).message}`.slice(0, 300),
        },
      });
      failed += 1;
      continue;
    }

    try {
      const providerMessageId = await sendMail({
        to: job.user.email,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      });
      await prisma.emailJob.update({
        where: { id: job.id },
        data: {
          status: "sent",
          attempts: job.attempts + 1,
          providerMessageId,
          sentAt: new Date(),
          lastError: null,
        },
      });
      sent += 1;
    } catch (cause) {
      const attempts = job.attempts + 1;
      await prisma.emailJob.update({
        where: { id: job.id },
        data: {
          status: attempts >= MAX_ATTEMPTS ? "failed" : "queued",
          attempts,
          lastError: (cause as Error).message.slice(0, 300),
        },
      });
      failed += 1;
    }
  }

  const remaining = await prisma.emailJob.count({ where: { status: "queued" } });
  return { sent, failed, skipped, remaining };
}

/** The next instant a tip is due, for `/admin/email`'s "what happens next" line. */
export function nextTipDay(registeredAt: Date, now: Date = new Date()): { template: TemplateId; at: Date } | null {
  const schedule: Array<{ template: TemplateId; days: number }> = [
    { template: "tip_day_1", days: 1 },
    { template: "tip_day_3", days: 3 },
    { template: "tip_day_7", days: 7 },
  ];
  for (const step of schedule) {
    const at = new Date(registeredAt.getTime() + step.days * 86_400_000);
    if (at > now) return { template: step.template, at };
  }
  return null;
}

export function tomorrowKey(now: Date = new Date()): string {
  return addDays(dayKey(now), 1);
}
