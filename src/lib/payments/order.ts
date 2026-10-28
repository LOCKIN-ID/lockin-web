/**
 * Orders, from the cart to "everything is in your library".
 *
 * The one rule this file exists to keep: **the browser never sends a price.** It sends a
 * plan id or a book slug, `quoteFor` looks the price up (the plan table for plans, the
 * `Book` row for single books) and returns a quote, and `createOrder` writes *that*. A
 * tampered request can change what someone buys; it cannot change what it costs.
 *
 * Settlement is one function, called by the mock's settle button and by the Midtrans
 * webhook alike, and every write inside it is either idempotent by unique constraint or
 * guarded by a status check: so a webhook retried five times grants one entitlement, one
 * receipt and twenty XP.
 */

import { planById, planToItem, type PlanItemKind, type PlanId } from "@/content/plans";
import { enqueue } from "@/lib/email/queue";
import { awardBadges } from "@/lib/gamification/badges";
import { awardXp, XP, XpSource } from "@/lib/gamification/xp";
import { driverIsD1, prisma } from "@/lib/prisma";
import { ORDER_WINDOW_MINUTES, paymentProvider, type Charge, type PaymentGateway } from "./gateway";
import { MidtransGateway } from "./midtrans";
import { MockGateway } from "./mock";

/** Seven days of refunds, thirty-one days of Pro. The grace day is why a renewal is never late. */
export const PRO_DURATION_DAYS = 30;
export const PRO_GRACE_DAYS = 1;
export const REFUND_WINDOW_DAYS = 7;

export interface CheckoutInput {
  planId?: PlanId;
  bookSlug?: string;
  couponCode?: string;
  channel?: string;
}

/** An `OrderItem` before it is a row: priced by this module, never by the caller. */
export interface PricedItem {
  kind: PlanItemKind;
  refId: string;
  titleSnapshot: string;
  priceIdr: number;
  qty: number;
}

export interface Quote {
  items: PricedItem[];
  subtotalIdr: number;
  discountIdr: number;
  totalIdr: number;
  coupon: { code: string; percentOffBps: number } | null;
}

export type QuoteResult = { ok: true; quote: Quote } | { ok: false; reason: string };

export function gateway(): PaymentGateway {
  return paymentProvider() === "midtrans" ? new MidtransGateway() : new MockGateway();
}

/** `LOCKIN-<base36 time>-<6 random>`: sortable, unique, and readable in a support ticket. */
export function newProviderOrderId(now: Date = new Date()): string {
  const stamp = now.getTime().toString(36).toUpperCase();
  const random = Array.from({ length: 6 }, () => "0123456789ABCDEFGHJKMNPQRSTVWXYZ"[Math.floor(Math.random() * 32)]).join("");
  return `LOCKIN-${stamp}-${random}`;
}

function bookItem(book: { slug: string; title: string; priceIdr: number }): PricedItem {
  return {
    kind: "book",
    refId: book.slug,
    titleSnapshot: book.title,
    priceIdr: book.priceIdr,
    qty: 1,
  };
}

/**
 * What this purchase costs, before anything is written.
 *
 * Refusals are sentences, not codes: they are shown to the buyer as they are.
 */
export async function quoteFor(
  userId: string,
  input: CheckoutInput,
  now: Date = new Date(),
): Promise<QuoteResult> {
  let items: PricedItem[];

  if (input.planId) {
    const plan = planById(input.planId);
    if (!plan) return { ok: false, reason: "That plan does not exist." };
    items = [planToItem(plan)];

    if (plan.grants === "pro") {
      const live = await prisma.entitlement.findFirst({
        where: { userId, kind: "pro", OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
        select: { expiresAt: true },
      });
      if (live) {
        const until = live.expiresAt?.toISOString().slice(0, 10) ?? "no expiry";
        return { ok: false, reason: `Your Pro subscription already runs to ${until}.` };
      }
    }

    if (plan.grants === "all_books") {
      const owned = await prisma.entitlement.findFirst({
        where: { userId, kind: "all_books" },
        select: { id: true },
      });
      if (owned) return { ok: false, reason: "You already own every book, for good." };
    }
  } else if (input.bookSlug) {
    const book = await prisma.book.findFirst({
      where: { slug: input.bookSlug, publishedAt: { not: null } },
      select: { slug: true, title: true, priceIdr: true },
    });
    if (!book) return { ok: false, reason: "That book is not on sale." };
    if (book.priceIdr <= 0) {
      return { ok: false, reason: `${book.title} is free: open it from the library.` };
    }

    const already = await prisma.entitlement.findFirst({
      where: { userId, kind: "book", refId: book.slug },
      select: { id: true },
    });
    if (already) return { ok: false, reason: `${book.title} is already in your library.` };

    items = [bookItem(book)];
  } else {
    return { ok: false, reason: "Choose a book or a plan." };
  }

  const subtotalIdr = items.reduce((sum, item) => sum + item.priceIdr * item.qty, 0);
  let discountIdr = 0;
  let coupon: Quote["coupon"] = null;

  if (input.couponCode) {
    const found = await prisma.coupon.findUnique({ where: { code: input.couponCode.toUpperCase() } });
    const usable =
      found &&
      found.active &&
      (found.expiresAt === null || found.expiresAt > now) &&
      (found.maxUses === null || found.uses < found.maxUses) &&
      (found.appliesTo === "all" ||
        (found.appliesTo === "book" && items.some((item) => item.kind === "book")) ||
        (found.appliesTo === "pro" && items.some((item) => item.kind !== "book")));

    if (!usable) return { ok: false, reason: `The code ${input.couponCode.toUpperCase()} is not valid.` };

    discountIdr =
      found.amountOffIdr !== null && found.amountOffIdr !== undefined
        ? Math.min(found.amountOffIdr, subtotalIdr)
        : Math.round((subtotalIdr * found.percentOffBps) / 10_000);
    coupon = { code: found.code, percentOffBps: found.percentOffBps };
  }

  return {
    ok: true,
    quote: {
      items,
      subtotalIdr,
      discountIdr,
      totalIdr: Math.max(0, subtotalIdr - discountIdr),
      coupon,
    },
  };
}

export interface StartedOrder {
  ok: true;
  orderId: string;
  providerOrderId: string;
  totalIdr: number;
  /** Present unless the total was zero, in which case it settled already. */
  charge: Charge | null;
  settled: boolean;
}

export type StartResult = StartedOrder | { ok: false; reason: string };

/** Prices, writes the order and its items, then asks the gateway for something to pay. */
export async function createOrder(
  userId: string,
  input: CheckoutInput,
  now: Date = new Date(),
): Promise<StartResult> {
  const quoted = await quoteFor(userId, input, now);
  if (!quoted.ok) return quoted;
  const { quote } = quoted;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });
  if (!user) return { ok: false, reason: "Sign in again: that account no longer exists." };

  const providerOrderId = newProviderOrderId(now);
  const expiresAt = new Date(now.getTime() + ORDER_WINDOW_MINUTES * 60_000);

  const orderData = {
    userId,
    status: "pending",
    provider: paymentProvider(),
    providerOrderId,
    grossAmountIdr: quote.totalIdr,
    discountIdr: quote.discountIdr,
    couponCode: quote.coupon?.code ?? null,
    channel: quote.totalIdr === 0 ? "free" : (input.channel ?? "qris"),
    expiresAt,
    items: {
      create: quote.items.map((item) => ({
        kind: item.kind,
        refId: item.refId,
        titleSnapshot: item.titleSnapshot,
        priceIdr: item.priceIdr,
        qty: item.qty,
      })),
    },
  };

  // Header and items have to land together, but D1 has no interactive transactions, so on
  // D1 they are written in order and a half-written order is cleaned up by `expireStale`.
  const order = driverIsD1()
    ? await prisma.order.create({ data: orderData, select: { id: true } })
    : await prisma.$transaction(async (tx) => tx.order.create({ data: orderData, select: { id: true } }));

  // Free is a real purchase with a real receipt; it just has no bank in the middle.
  if (quote.totalIdr === 0) {
    await settleOrder(providerOrderId, { channel: "free" }, now);
    return { ok: true, orderId: order.id, providerOrderId, totalIdr: 0, charge: null, settled: true };
  }

  const charge = await gateway().createCharge({
    providerOrderId,
    grossAmountIdr: quote.totalIdr,
    customer: { name: user.name ?? "LOCK.IN reader", email: user.email },
    channel: input.channel,
    items: quote.items.map((item) => ({ title: item.titleSnapshot, priceIdr: item.priceIdr, qty: item.qty })),
  });

  await prisma.order.update({
    where: { id: order.id },
    data: {
      providerToken: charge.token ?? null,
      channel: charge.channel,
      vaNumber: charge.vaNumber ?? null,
      qrString: charge.qrString ?? null,
      expiresAt: charge.expiresAt,
    },
  });

  return { ok: true, orderId: order.id, providerOrderId, totalIdr: quote.totalIdr, charge, settled: false };
}

export interface SettlementDetail {
  channel?: string;
  vaNumber?: string;
  qrString?: string;
  providerToken?: string;
  /** The provider's own words, kept for the webhook log. */
  raw?: unknown;
}

export interface SettlementResult {
  settled: boolean;
  alreadyPaid: boolean;
  reason?: string;
  /** Entitlement labels granted by this call, for the toast on the pay page. */
  grants: string[];
  xp: number;
  badges: string[];
}

const NOT_SETTLED: SettlementResult = { settled: false, alreadyPaid: false, grants: [], xp: 0, badges: [] };

/**
 * The money arrived. Grants the entitlements, spends the coupon, pays the XP, sends the
 * receipt: once, whatever the provider says and however often it says it.
 */
export async function settleOrder(
  providerOrderId: string,
  detail: SettlementDetail = {},
  now: Date = new Date(),
): Promise<SettlementResult> {
  const order = await prisma.order.findUnique({
    where: { providerOrderId },
    include: {
      items: true,
      user: { select: { name: true, email: true } },
    },
  });

  if (!order) return { ...NOT_SETTLED, reason: "unknown_order" };
  if (order.status === "paid") return { settled: true, alreadyPaid: true, grants: [], xp: 0, badges: [] };
  if (order.status !== "pending") return { ...NOT_SETTLED, reason: `order is ${order.status}` };

  // The status check and this update are the only guard needed: another caller that got
  // here first has already set `paid`, and the row update below is the same value.
  const claimed = await prisma.order.updateMany({
    where: { id: order.id, status: "pending" },
    data: {
      status: "paid",
      paidAt: now,
      channel: detail.channel ?? order.channel,
      vaNumber: detail.vaNumber ?? order.vaNumber,
      qrString: detail.qrString ?? order.qrString,
      providerToken: detail.providerToken ?? order.providerToken,
      failureReason: null,
    },
  });
  if (claimed.count === 0) {
    return { settled: true, alreadyPaid: true, grants: [], xp: 0, badges: [] };
  }

  const grants: string[] = [];

  for (const item of order.items) {
    if (item.kind === "lifetime") {
      await prisma.entitlement.upsert({
        where: { userId_kind_refId: { userId: order.userId, kind: "all_books", refId: "" } },
        create: { userId: order.userId, kind: "all_books", refId: "", sourceOrderId: order.id, grantedAt: now },
        update: { sourceOrderId: order.id },
      });
      grants.push(item.titleSnapshot);
      continue;
    }

    if (item.kind === "pro_subscription") {
      const existing = await prisma.entitlement.findUnique({
        where: { userId_kind_refId: { userId: order.userId, kind: "pro", refId: "" } },
        select: { expiresAt: true },
      });
      // A renewal extends the run rather than restarting it, so nobody loses days by
      // paying early. The grace day keeps a monthly payer from lapsing on a slow bank.
      const from = existing?.expiresAt && existing.expiresAt > now ? existing.expiresAt : now;
      const expiresAt = new Date(
        from.getTime() + (PRO_DURATION_DAYS + PRO_GRACE_DAYS) * 86_400_000,
      );
      await prisma.entitlement.upsert({
        where: { userId_kind_refId: { userId: order.userId, kind: "pro", refId: "" } },
        create: {
          userId: order.userId,
          kind: "pro",
          refId: "",
          sourceOrderId: order.id,
          grantedAt: now,
          expiresAt,
        },
        update: { sourceOrderId: order.id, expiresAt },
      });
      grants.push(item.titleSnapshot);
      continue;
    }

    // A single book, kept forever.
    await prisma.entitlement.upsert({
      where: { userId_kind_refId: { userId: order.userId, kind: "book", refId: item.refId } },
      create: {
        userId: order.userId,
        kind: "book",
        refId: item.refId,
        sourceOrderId: order.id,
        grantedAt: now,
        expiresAt: null,
      },
      update: { sourceOrderId: order.id },
    });
    grants.push(item.titleSnapshot);
  }

  if (order.couponCode) {
    // Only reached once per paid order, because the status claim above is what got us here.
    await prisma.coupon.update({
      where: { code: order.couponCode },
      data: { uses: { increment: 1 } },
    });
  }

  const xpAward = await awardXp(order.userId, XpSource.PURCHASE, order.id, XP.PURCHASE, now);
  const awarded = await awardBadges(order.userId, undefined, now);

  await enqueue(order.userId, "receipt", {
    subject: `Receipt for order ${order.providerOrderId}`,
    payload: {
      name: order.user.name ?? "",
      userId: order.userId,
      orderRef: order.providerOrderId,
      items: order.items.map((item) => ({ title: item.titleSnapshot, priceIdr: item.priceIdr * item.qty })),
      total: order.grossAmountIdr,
      discount: order.discountIdr,
      paidAt: now.toISOString(),
    },
    dedupeKey: order.id,
  });

  return {
    settled: true,
    alreadyPaid: false,
    grants: Array.from(new Set(grants)),
    xp: xpAward.awarded,
    badges: awarded.map((badge) => badge.title),
  };
}

/** The provider said no: expired, denied, cancelled. The order keeps its reason. */
export async function failOrder(providerOrderId: string, reason: string): Promise<boolean> {
  const result = await prisma.order.updateMany({
    where: { providerOrderId, status: "pending" },
    data: { status: "failed", failureReason: reason.slice(0, 300) },
  });
  return result.count > 0;
}

/** Pending orders that ran out of their half hour. Safe to run at any time, as often as you like. */
export async function expireStaleOrders(now: Date = new Date()): Promise<number> {
  const result = await prisma.order.updateMany({
    where: { status: "pending", expiresAt: { lt: now } },
    data: { status: "expired", failureReason: "not paid within 30 minutes" },
  });
  return result.count;
}

export interface OrderView {
  id: string;
  providerOrderId: string;
  status: string;
  provider: string;
  channel: string | null;
  vaNumber: string | null;
  qrString: string | null;
  providerToken: string | null;
  grossAmountIdr: number;
  discountIdr: number;
  couponCode: string | null;
  expiresAt: Date;
  paidAt: Date | null;
  failureReason: string | null;
  createdAt: Date;
  items: Array<{ title: string; kind: string; refId: string; priceIdr: number; qty: number }>;
}

/** One order, but only for its owner. */
export async function orderFor(userId: string, orderId: string): Promise<OrderView | null> {
  return prisma.order.findFirst({
    where: { id: orderId, userId },
    select: {
      id: true,
      providerOrderId: true,
      status: true,
      provider: true,
      channel: true,
      vaNumber: true,
      qrString: true,
      providerToken: true,
      grossAmountIdr: true,
      discountIdr: true,
      couponCode: true,
      expiresAt: true,
      paidAt: true,
      failureReason: true,
      createdAt: true,
      items: {
        select: { titleSnapshot: true, kind: true, refId: true, priceIdr: true, qty: true },
      },
    },
  }).then((row) =>
    row
      ? {
          ...row,
          items: row.items.map((item) => ({
            title: item.titleSnapshot,
            kind: item.kind,
            refId: item.refId,
            priceIdr: item.priceIdr,
            qty: item.qty,
          })),
        }
      : null,
  );
}

/** The reader's orders, newest first, for `/app/settings` and the support form. */
export async function ordersFor(userId: string, take = 25) {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      providerOrderId: true,
      status: true,
      grossAmountIdr: true,
      discountIdr: true,
      couponCode: true,
      channel: true,
      paidAt: true,
      expiresAt: true,
      createdAt: true,
      items: { select: { titleSnapshot: true, kind: true, refId: true, priceIdr: true, qty: true } },
    },
  });
}
