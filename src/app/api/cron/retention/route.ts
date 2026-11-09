import { timingSafeEqual } from "node:crypto";

import { prunePageViews } from "@/lib/analytics";
import { drainQueue, enqueueScheduled } from "@/lib/email/queue";
import { expireStaleOrders } from "@/lib/payments/order";

/**
 * The daily retention job.
 *
 * Vercel Hobby allows one run a day, so the run is placed at 19:00 Jakarta (`0 12 * * *`
 * UTC): the hour the streak reminder is due. Jakarta has no daylight saving, so that
 * mapping never drifts. `enqueueScheduled` queues everything the schedule owes and
 * `drainQueue` sends what is due; both are idempotent, which is why `scripts/dev-cron.ts`
 * can hammer the same route every two minutes locally without sending a mail twice.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorised(header: string | null): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : "";
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  if (!authorised(request.headers.get("authorization"))) {
    return Response.json({ error: "unauthorised" }, { status: 401 });
  }

  const now = new Date();
  // The retention run is also the only clock the app has, so the orders that ran out of
  // their thirty minutes are released here rather than by a browser that may never return.
  const expired = await expireStaleOrders(now);
  const { queued } = await enqueueScheduled(now);
  const drained = await drainQueue(25, now);
  // The traffic rows are the other thing on a clock: a page view is kept 90 days and no
  // longer, which is a promise the privacy article makes and this job keeps.
  const prunedViews = await prunePageViews(now);

  return Response.json({
    expired,
    queued,
    sent: drained.sent,
    failed: drained.failed,
    skipped: drained.skipped,
    remaining: drained.remaining,
    prunedViews,
    at: now.toISOString(),
  });
}
