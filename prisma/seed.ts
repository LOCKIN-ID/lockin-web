import "dotenv/config";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { books } from "../src/content/books";
import { BADGES } from "../src/content/badges";
import { REWARDS } from "../src/content/rewards";
import { HELP_ARTICLES } from "../src/content/help";
import { XP, XpSource, levelForXp } from "../src/lib/gamification/xp";
import { dayKey, previousDayKey, streakXp } from "../src/lib/gamification/streak";

/**
 * The seed. Everything it writes is idempotent — every insert is an `upsert` on the same
 * unique key the runtime uses — so running it twice leaves the same database, and running
 * it after a content edit updates the rows instead of duplicating them.
 *
 * It also creates the two accounts the demo needs: an admin, and a learner with three days
 * of history so the streak, the XP bar, the badges and the leaderboard are not empty
 * screens. Both are on `@lockin.test` and both are labelled `seed` in `/admin/users`.
 *
 * Prices here are provisional (the deck's sample ladder): Beginner free, Pro Rp49.000 for
 * 30 days, Lifetime Rp399.000. Changing them is one edit in BOOK_CATALOG or PLANS.
 */

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  }),
});

/** Catalogue fields that are not content: what a book costs and how it is dressed. */
const BOOK_CATALOG: Record<
  string,
  {
    blurb: string;
    priceIdr: number;
    compareAtIdr: number | null;
    colorBand: "forest" | "mint" | "taupe";
    sortOrder: number;
  }
> = {
  beginner: {
    blurb: "Never opened a code editor? Write your first real page tonight.",
    priceIdr: 0, // free, on purpose: the deck's acquisition tier
    compareAtIdr: null,
    colorBand: "mint",
    sortOrder: 1,
  },
  intermediate: {
    blurb: "Make a page respond: values, functions, the DOM, and one honest piece of state.",
    priceIdr: 99000,
    compareAtIdr: 149000,
    colorBand: "forest",
    sortOrder: 2,
  },
  expert: {
    blurb: "Python and the shell on real files — read a log, build a report, run it twice safely.",
    priceIdr: 149000,
    compareAtIdr: 199000,
    colorBand: "taupe",
    sortOrder: 3,
  },
};

const SEED_LEARNER = "student@lockin.test";
const SEED_ADMIN = "admin@lockin.test";
const SEED_PASSWORD_LEARNER = "lockin-student-2026";

async function upsertAccount(email: string, name: string, password: string, role: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  const userId = existing?.id ?? randomUUID();
  const hashed = await hashPassword(password);

  await prisma.user.upsert({
    where: { email },
    create: {
      id: userId,
      email,
      name,
      emailVerified: true,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    update: { name, role, emailVerified: true },
  });

  // The credential row better-auth's email/password provider looks for.
  const account = await prisma.account.findFirst({
    where: { userId, providerId: "credential" },
  });
  if (account) {
    await prisma.account.update({ where: { id: account.id }, data: { password: hashed } });
  } else {
    await prisma.account.create({
      data: {
        id: randomUUID(),
        userId,
        accountId: userId,
        providerId: "credential",
        password: hashed,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  await prisma.profile.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
  await prisma.emailPreference.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

  return userId;
}

async function main() {
  // ---- catalogue ----------------------------------------------------------
  for (const book of books) {
    const catalog = BOOK_CATALOG[book.slug];
    if (!catalog) throw new Error(`seed: no catalogue entry for book "${book.slug}"`);

    await prisma.book.upsert({
      where: { slug: book.slug },
      create: {
        slug: book.slug,
        title: book.title,
        tier: book.tier,
        levelLabel: book.levelLabel,
        blurb: catalog.blurb,
        promise: book.promise,
        pageCount: book.pageCount,
        priceIdr: catalog.priceIdr,
        compareAtIdr: catalog.compareAtIdr,
        coverPath: `/brand/covers/${book.slug}.svg`,
        bandToken: catalog.colorBand,
        pdfPath: `/api/ebooks/${book.slug}/pdf`,
        publishedAt: new Date(),
        sortOrder: catalog.sortOrder,
      },
      update: {
        title: book.title,
        tier: book.tier,
        levelLabel: book.levelLabel,
        blurb: catalog.blurb,
        promise: book.promise,
        pageCount: book.pageCount,
        priceIdr: catalog.priceIdr,
        compareAtIdr: catalog.compareAtIdr,
        coverPath: `/brand/covers/${book.slug}.svg`,
        bandToken: catalog.colorBand,
        pdfPath: `/api/ebooks/${book.slug}/pdf`,
        sortOrder: catalog.sortOrder,
      },
    });

    for (const quest of book.quests) {
      await prisma.quest.upsert({
        where: { slug: quest.slug },
        create: {
          slug: quest.slug,
          code: quest.code,
          title: quest.title,
          kind: quest.kind,
          bookSlug: book.slug,
          chapterId: quest.chapterId,
          targetUrl: quest.targetUrl ?? null,
          payload: (quest.payload ?? {}) as object,
          xpReward: quest.xp,
          publishedAt: new Date(),
        },
        update: {
          code: quest.code,
          title: quest.title,
          kind: quest.kind,
          bookSlug: book.slug,
          chapterId: quest.chapterId,
          targetUrl: quest.targetUrl ?? null,
          payload: (quest.payload ?? {}) as object,
          xpReward: quest.xp,
        },
      });
    }
  }

  for (const badge of BADGES) {
    await prisma.badge.upsert({
      where: { slug: badge.slug },
      create: {
        slug: badge.slug,
        title: badge.title,
        requirement: badge.requirement,
        rule: badge.rule,
        kind: badge.kind,
        xpReward: badge.xpReward,
        sortOrder: badge.sortOrder,
      },
      update: {
        title: badge.title,
        requirement: badge.requirement,
        rule: badge.rule,
        kind: badge.kind,
        xpReward: badge.xpReward,
        sortOrder: badge.sortOrder,
      },
    });
  }

  for (const reward of REWARDS) {
    await prisma.reward.upsert({
      where: { slug: reward.slug },
      create: {
        slug: reward.slug,
        title: reward.title,
        description: reward.description,
        costXp: reward.costXp,
        kind: reward.kind,
        value: reward.value,
        stock: reward.stock,
        active: true,
        sortOrder: reward.sortOrder,
      },
      update: {
        title: reward.title,
        description: reward.description,
        costXp: reward.costXp,
        kind: reward.kind,
        value: reward.value,
        stock: reward.stock,
        sortOrder: reward.sortOrder,
      },
    });
  }

  const couponYear = new Date();
  couponYear.setFullYear(couponYear.getFullYear() + 1);
  const coupons = [
    { code: "LOCKIN10", percentOffBps: 1000, maxUses: 200 },
    { code: "FRIENDS25", percentOffBps: 2500, maxUses: 50 },
  ];
  for (const coupon of coupons) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      create: {
        code: coupon.code,
        percentOffBps: coupon.percentOffBps,
        amountOffIdr: null,
        appliesTo: "all",
        maxUses: coupon.maxUses,
        uses: 0,
        expiresAt: couponYear,
        active: true,
      },
      update: { percentOffBps: coupon.percentOffBps, maxUses: coupon.maxUses, active: true },
    });
  }

  for (const article of HELP_ARTICLES) {
    await prisma.helpArticle.upsert({
      where: { slug: article.slug },
      create: {
        slug: article.slug,
        title: article.title,
        category: article.category,
        summary: article.summary,
        bodyMd: article.bodyMd,
        keywords: article.keywords,
        sortOrder: article.sortOrder,
      },
      update: {
        title: article.title,
        category: article.category,
        summary: article.summary,
        bodyMd: article.bodyMd,
        keywords: article.keywords,
        sortOrder: article.sortOrder,
      },
    });
  }

  // ---- people -------------------------------------------------------------
  const adminId = await upsertAccount(
    SEED_ADMIN,
    "LOCK.IN Admin",
    process.env.SEED_ADMIN_PASSWORD ?? "lockin-admin-2026",
    "admin",
  );
  const learnerId = await upsertAccount(
    SEED_LEARNER,
    "Rani the seed learner",
    SEED_PASSWORD_LEARNER,
    "user",
  );

  // ---- three days of history, so the first screen has numbers on it --------
  const today = dayKey(new Date());
  const yesterday = previousDayKey(today);
  const dayBefore = previousDayKey(yesterday);

  const history: Array<{ day: string; source: string; refId: string; amount: number }> = [
    { day: dayBefore, source: XpSource.SECTION, refId: "b1s1", amount: XP.SECTION },
    { day: dayBefore, source: XpSource.PLAYGROUND, refId: `seed-run-${dayBefore}`, amount: XP.PLAYGROUND },
    { day: dayBefore, source: XpSource.STREAK, refId: dayBefore, amount: streakXp(1) },
    { day: yesterday, source: XpSource.SECTION, refId: "b1s2", amount: XP.SECTION },
    { day: yesterday, source: XpSource.STREAK, refId: yesterday, amount: streakXp(2) },
    { day: today, source: XpSource.SECTION, refId: "b1s3", amount: XP.SECTION },
    { day: today, source: XpSource.CHECKPOINT, refId: "b1-check", amount: XP.CHECKPOINT },
    { day: today, source: XpSource.STREAK, refId: today, amount: streakXp(3) },
  ];

  for (const event of history) {
    await prisma.xpEvent.upsert({
      where: {
        userId_source_refId: { userId: learnerId, source: event.source, refId: event.refId },
      },
      create: {
        userId: learnerId,
        source: event.source,
        refId: event.refId,
        amount: event.amount,
        dayKey: event.day,
      },
      update: { amount: event.amount, dayKey: event.day },
    });
  }

  // Two unlocked badges, with their XP recorded like any other award.
  const unlocked = ["hello-world", "first-section"];
  for (const slug of unlocked) {
    const badge = await prisma.badge.findUniqueOrThrow({ where: { slug } });
    await prisma.userBadge.upsert({
      where: { userId_badgeId: { userId: learnerId, badgeId: badge.id } },
      create: { userId: learnerId, badgeId: badge.id },
      update: {},
    });
    await prisma.xpEvent.upsert({
      where: {
        userId_source_refId: { userId: learnerId, source: XpSource.BADGE, refId: slug },
      },
      create: {
        userId: learnerId,
        source: XpSource.BADGE,
        refId: slug,
        amount: badge.xpReward,
        dayKey: today,
      },
      update: { amount: badge.xpReward },
    });
  }

  // Day totals and the profile are derived, so they cannot drift from the event rows.
  for (const day of [dayBefore, yesterday, today]) {
    const aggregate = await prisma.xpEvent.aggregate({
      where: { userId: learnerId, dayKey: day },
      _sum: { amount: true },
    });
    await prisma.dailyActivity.upsert({
      where: { userId_dayKey: { userId: learnerId, dayKey: day } },
      create: { userId: learnerId, dayKey: day, xpEarned: aggregate._sum.amount ?? 0 },
      update: { xpEarned: aggregate._sum.amount ?? 0 },
    });
  }

  const total = await prisma.xpEvent.aggregate({
    where: { userId: learnerId },
    _sum: { amount: true },
  });
  const xp = total._sum.amount ?? 0;
  await prisma.profile.update({
    where: { userId: learnerId },
    data: {
      xp,
      level: levelForXp(xp),
      streakCurrent: 3,
      streakBest: 3,
      lastStreakDay: today,
      daysActive: 3,
    },
  });

  // ---- reading progress, so the reader shows a tick on chapter 1 ----------
  for (const sectionId of ["b1s1", "b1s2", "b1s3"]) {
    await prisma.readingProgress.upsert({
      where: {
        userId_bookSlug_chapterId_sectionId: {
          userId: learnerId,
          bookSlug: "beginner",
          chapterId: "b1",
          sectionId,
        },
      },
      create: {
        userId: learnerId,
        bookSlug: "beginner",
        chapterId: "b1",
        sectionId,
        secondsSpent: 240,
        completedAt: new Date(),
      },
      update: { completedAt: new Date() },
    });
  }

  const counts = {
    books: await prisma.book.count(),
    quests: await prisma.quest.count(),
    badges: await prisma.badge.count(),
    rewards: await prisma.reward.count(),
    coupons: await prisma.coupon.count(),
    help: await prisma.helpArticle.count(),
    users: await prisma.user.count(),
  };
  console.log(
    `seed: ${counts.books} books, ${counts.quests} quests, ${counts.badges} badges, ${counts.rewards} rewards, ${counts.coupons} coupons, ${counts.help} help articles, ${counts.users} users`,
  );
  console.log(`seed: admin ${SEED_ADMIN}, learner ${SEED_LEARNER} / ${SEED_PASSWORD_LEARNER}`);
  console.log(`seed: admin id ${adminId.slice(0, 8)}…, learner ${xp} XP, level ${levelForXp(xp)}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
