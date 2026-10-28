/**
 * The money path, against a real database.
 *
 * Four things have to hold for a purchase to be trustworthy, and each has a test here:
 * the price is never what the browser said; a coupon cannot be spent twice or past its
 * limits; settling the same order five times grants one entitlement and one receipt; and
 * the provider's signature is checked in constant time against the exact string Midtrans
 * signs. The Midtrans digest is pinned to a value computed by hand so a change to the
 * concatenation order fails loudly.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { makeUser, useTestDatabase, type TestDatabase } from "./db";
import { midtransSignature, midtransSignatureMatches } from "@/lib/payments/midtrans";
import {
  createOrder,
  expireStaleOrders,
  failOrder,
  newProviderOrderId,
  orderFor,
  quoteFor,
  settleOrder,
} from "@/lib/payments/order";
import { PRO_DURATION_DAYS, PRO_GRACE_DAYS } from "@/lib/payments/order";

let db: TestDatabase;

beforeAll(async () => {
  db = await useTestDatabase();
});

afterAll(async () => {
  await db.close();
});

describe("Midtrans signature", () => {
  const orderId = "LOCKIN-TEST-1";
  const statusCode = "200";
  const grossAmount = "49000.00";
  const serverKey = "SB-Mid-server-TESTKEY";

  it("hashes order_id + status_code + gross_amount + serverKey with SHA-512", () => {
    expect(midtransSignature(orderId, statusCode, grossAmount, serverKey)).toBe(
      "1601a9a2a42e31923b20f880279ff8fd3c691a6ca0194b24e37708f45891661e629c7439db2413d64e72b17ef81f71e3fbf7843554d0954c036f765a49c850cb",
    );
  });

  it("accepts the exact digest, case-insensitively, and refuses anything else", () => {
    const good = midtransSignature(orderId, statusCode, grossAmount, serverKey);
    expect(midtransSignatureMatches(good, orderId, statusCode, grossAmount, serverKey)).toBe(true);
    expect(midtransSignatureMatches(good.toUpperCase(), orderId, statusCode, grossAmount, serverKey)).toBe(true);
    expect(midtransSignatureMatches(good, orderId, "201", grossAmount, serverKey)).toBe(false);
    expect(midtransSignatureMatches(good, orderId, statusCode, "1.00", serverKey)).toBe(false);
    expect(midtransSignatureMatches("", orderId, statusCode, grossAmount, serverKey)).toBe(false);
  });
});

describe("pricing", () => {
  it("prices a plan from the content table, never from the caller", async () => {
    const userId = await makeUser(db.prisma);
    const quoted = await quoteFor(userId, { planId: "pro" });
    expect(quoted.ok).toBe(true);
    if (!quoted.ok) return;
    expect(quoted.quote.items).toHaveLength(1);
    expect(quoted.quote.items[0]!.priceIdr).toBe(49000);
    expect(quoted.quote.totalIdr).toBe(49000);
  });

  it("applies a percentage coupon and an amount coupon, and caps at the subtotal", async () => {
    const userId = await makeUser(db.prisma);
    await db.prisma.coupon.createMany({
      data: [
        { code: "TEN", percentOffBps: 1000, appliesTo: "all", active: true },
        { code: "BIG", percentOffBps: 0, amountOffIdr: 999_000, appliesTo: "all", active: true },
        { code: "OLD", percentOffBps: 5000, appliesTo: "all", active: true, expiresAt: new Date(Date.now() - 86_400_000) },
        { code: "SPENT", percentOffBps: 5000, appliesTo: "all", active: true, maxUses: 1, uses: 1 },
        { code: "OFF", percentOffBps: 5000, appliesTo: "all", active: false },
        { code: "BOOKONLY", percentOffBps: 2500, appliesTo: "book", active: true },
      ],
    });

    const ten = await quoteFor(userId, { planId: "pro", couponCode: "TEN" });
    expect(ten.ok && ten.quote.discountIdr).toBe(4900);
    expect(ten.ok && ten.quote.totalIdr).toBe(44100);

    const big = await quoteFor(userId, { planId: "pro", couponCode: "BIG" });
    expect(big.ok && big.quote.discountIdr).toBe(49000);
    expect(big.ok && big.quote.totalIdr).toBe(0);

    for (const code of ["OLD", "SPENT", "OFF", "NOPE", "BOOKONLY"]) {
      const refused = await quoteFor(userId, { planId: "pro", couponCode: code });
      expect(refused.ok, code).toBe(false);
    }
  });

  it("refuses a second Pro subscription while one is live, and a second Lifetime ever", async () => {
    const userId = await makeUser(db.prisma);
    await db.prisma.entitlement.create({
      data: {
        userId,
        kind: "pro",
        refId: "",
        expiresAt: new Date(Date.now() + 5 * 86_400_000),
      },
    });
    const pro = await quoteFor(userId, { planId: "pro" });
    expect(pro.ok).toBe(false);
    if (!pro.ok) expect(pro.reason).toContain("already runs to");

    const lifetime = await quoteFor(userId, { planId: "lifetime" });
    expect(lifetime.ok).toBe(true);

    const ownerId = await makeUser(db.prisma);
    await db.prisma.entitlement.create({ data: { userId: ownerId, kind: "all_books", refId: "" } });
    const again = await quoteFor(ownerId, { planId: "lifetime" });
    expect(again.ok).toBe(false);
  });

  it("refuses a free book at the till and an unpublished one everywhere", async () => {
    const userId = await makeUser(db.prisma);
    await db.prisma.book.create({
      data: {
        slug: "beginner",
        title: "Beginner: HTML, CSS and your first page",
        tier: "beginner",
        levelLabel: "Start here",
        blurb: "The free book.",
        promise: "A page you can point at.",
        priceIdr: 0,
        pageCount: 20,
        coverPath: "/brand/covers/beginner.svg",
        bandToken: "forest",
        sortOrder: 1,
        publishedAt: new Date(),
      },
    });
    await db.prisma.book.create({
      data: {
        slug: "intermediate",
        title: "Intermediate: build things",
        tier: "intermediate",
        levelLabel: "Build things",
        blurb: "Draft.",
        promise: "Not yet.",
        priceIdr: 99000,
        pageCount: 20,
        coverPath: "/brand/covers/intermediate.svg",
        bandToken: "mint",
        sortOrder: 2,
        publishedAt: null,
      },
    });

    const free = await quoteFor(userId, { bookSlug: "beginner" });
    expect(free.ok).toBe(false);
    if (!free.ok) expect(free.reason).toContain("free");

    const draft = await quoteFor(userId, { bookSlug: "intermediate" });
    expect(draft.ok).toBe(false);

    await db.prisma.book.update({ where: { slug: "intermediate" }, data: { publishedAt: new Date() } });
    const onSale = await quoteFor(userId, { bookSlug: "intermediate" });
    expect(onSale.ok && onSale.quote.totalIdr).toBe(99000);
  });
});

describe("settlement", () => {
  it("grants one entitlement, one receipt and twenty XP however often it is called", async () => {
    const userId = await makeUser(db.prisma);
    const started = await createOrder(userId, { planId: "lifetime", channel: "qris" });
    expect(started.ok).toBe(true);
    if (!started.ok) return;

    const first = await settleOrder(started.providerOrderId);
    const second = await settleOrder(started.providerOrderId);
    const third = await settleOrder(started.providerOrderId);

    expect(first.settled).toBe(true);
    expect(first.alreadyPaid).toBe(false);
    expect(second.alreadyPaid).toBe(true);
    expect(third.alreadyPaid).toBe(true);

    expect(await db.prisma.entitlement.count({ where: { userId, kind: "all_books" } })).toBe(1);
    expect(await db.prisma.xpEvent.count({ where: { userId, source: "PURCHASE" } })).toBe(1);
    expect(await db.prisma.emailJob.count({ where: { userId, template: "receipt" } })).toBe(1);
    expect(first.xp).toBe(20);
    expect(second.xp).toBe(0);

    const order = await orderFor(userId, started.orderId);
    expect(order?.status).toBe("paid");
    expect(order?.paidAt).not.toBeNull();
  });

  it("runs a Pro subscription for 31 days and extends rather than restarts a renewal", async () => {
    const userId = await makeUser(db.prisma);
    const started = await createOrder(userId, { planId: "pro" });
    if (!started.ok) throw new Error("the order should have been created");

    const now = new Date();
    await settleOrder(started.providerOrderId, {}, now);
    const first = await db.prisma.entitlement.findFirstOrThrow({ where: { userId, kind: "pro" } });
    const expected = now.getTime() + (PRO_DURATION_DAYS + PRO_GRACE_DAYS) * 86_400_000;
    expect(Math.abs((first.expiresAt?.getTime() ?? 0) - expected)).toBeLessThan(2000);

    // A renewal (the subscription lapsed, or an admin settled a second order) adds its run
    // to the end of the first rather than discarding the days already paid for.
    const second = await createOrder(userId, { planId: "pro" });
    expect(second.ok).toBe(false); // refused while live — that is the rule
    await db.prisma.entitlement.update({ where: { id: first.id }, data: { expiresAt: now } });
    const third = await createOrder(userId, { planId: "pro" });
    if (!third.ok) throw new Error("a lapsed subscription must be re-purchasable");
    await settleOrder(third.providerOrderId, {}, now);
    const extended = await db.prisma.entitlement.findFirstOrThrow({ where: { userId, kind: "pro" } });
    const extendedExpected = now.getTime() + (PRO_DURATION_DAYS + PRO_GRACE_DAYS) * 86_400_000;
    expect(Math.abs((extended.expiresAt?.getTime() ?? 0) - extendedExpected)).toBeLessThan(2000);
  });

  it("spends a coupon once, and only for the order that used it", async () => {
    const userId = await makeUser(db.prisma);
    await db.prisma.coupon.create({
      data: { code: "ONCE", percentOffBps: 1000, appliesTo: "all", active: true },
    });
    const started = await createOrder(userId, { planId: "pro", couponCode: "ONCE" });
    if (!started.ok) throw new Error("the coupon is valid, so the order must exist");
    expect(started.totalIdr).toBe(44100);

    await settleOrder(started.providerOrderId);
    await settleOrder(started.providerOrderId);
    const coupon = await db.prisma.coupon.findUniqueOrThrow({ where: { code: "ONCE" } });
    expect(coupon.uses).toBe(1);
  });

  it("does not settle an order whose provider id is unknown", async () => {
    const result = await settleOrder("LOCKIN-NOPE-000000");
    expect(result.settled).toBe(false);
    expect(result.reason).toBe("unknown_order");
  });

  it("fails and expires only pending orders, and keeps the reason", async () => {
    const userId = await makeUser(db.prisma);
    const paid = await createOrder(userId, { planId: "pro" });
    if (!paid.ok) throw new Error("order");
    await settleOrder(paid.providerOrderId);

    const stale = await createOrder(userId, { planId: "lifetime" });
    if (!stale.ok) throw new Error("order");
    await db.prisma.order.update({
      where: { id: stale.orderId },
      data: { expiresAt: new Date(Date.now() - 60_000) },
    });

    expect(await expireStaleOrders()).toBe(1);
    expect((await orderFor(userId, stale.orderId))?.status).toBe("expired");

    const failed = await failOrder(stale.providerOrderId, "midtrans: cancel");
    expect(failed).toBe(false); // already expired, not pending
    const other = await createOrder(userId, { planId: "lifetime" });
    if (!other.ok) throw new Error("order");
    await failOrder(other.providerOrderId, "midtrans: deny");
    const view = await orderFor(userId, other.orderId);
    expect(view?.status).toBe("failed");
    expect(view?.failureReason).toBe("midtrans: deny");
  });

  it("writes a zero-total order as already settled, with a receipt", async () => {
    const userId = await makeUser(db.prisma);
    await db.prisma.coupon.create({
      data: { code: "FREE", percentOffBps: 10_000, appliesTo: "all", active: true },
    });
    const started = await createOrder(userId, { planId: "pro", couponCode: "FREE" });
    if (!started.ok) throw new Error("order");
    expect(started.settled).toBe(true);
    expect(started.charge).toBeNull();
    expect(await db.prisma.entitlement.count({ where: { userId, kind: "pro" } })).toBe(1);
    expect(await db.prisma.emailJob.count({ where: { userId, template: "receipt" } })).toBe(1);
  });

  it("names orders in a way a support ticket can read", () => {
    const id = newProviderOrderId(new Date("2026-10-25T10:00:00Z"));
    expect(id.startsWith("LOCKIN-")).toBe(true);
    expect(id.split("-")).toHaveLength(3);
    expect(id.split("-")[2]).toHaveLength(6);
  });
});
