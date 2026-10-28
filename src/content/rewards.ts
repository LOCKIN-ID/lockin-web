/**
 * Six things XP can be spent on. The catalogue is content, not data: the seed copies it
 * into `Reward` rows so a redemption can point at a stable id, and the copy can still be
 * edited in git.
 *
 * `value` is what the reader actually receives: a coupon code *pattern* (the redemption
 * appends its own suffix, so no two readers share a code) or an asset slug for the
 * cheatsheets and templates that ship in `public/downloads/`.
 */
export type RewardKind = "coupon" | "cheatsheet" | "template" | "badge_pin";

export interface RewardSeed {
  slug: string;
  title: string;
  description: string;
  costXp: number;
  kind: RewardKind;
  value: string;
  /** null = unlimited. A real cap keeps the coupon cost honest. */
  stock: number | null;
  sortOrder: number;
}

export const REWARDS: RewardSeed[] = [
  {
    slug: "cheatsheet-html-css",
    title: "HTML & CSS cheatsheet",
    description:
      "Every element, selector and layout property the beginner book uses, on one printable A4 sheet.",
    costXp: 60,
    kind: "cheatsheet",
    value: "cheatsheet-html-css",
    stock: null,
    sortOrder: 1,
  },
  {
    slug: "cheatsheet-js-python",
    title: "JavaScript & Python cheatsheet",
    description: "Values, loops, functions and the errors that actually bite: side by side.",
    costXp: 80,
    kind: "cheatsheet",
    value: "cheatsheet-js-python",
    stock: null,
    sortOrder: 2,
  },
  {
    slug: "template-sales-report",
    title: "Sales report template",
    description:
      "The expert book's CSV-to-report script with the column names left blank for your own file.",
    costXp: 150,
    kind: "template",
    value: "template-sales-report",
    stock: null,
    sortOrder: 3,
  },
  {
    slug: "badge-pin-night-owl",
    title: "Night Owl pin",
    description: "A profile pin for the people who study after midnight. Cosmetic, permanent.",
    costXp: 200,
    kind: "badge_pin",
    value: "night-owl",
    stock: null,
    sortOrder: 4,
  },
  {
    slug: "coupon-10",
    title: "10% off any book",
    description: "One code, one order, any single book. Stacks with nothing.",
    costXp: 400,
    kind: "coupon",
    value: "LOCKIN10",
    stock: 200,
    sortOrder: 5,
  },
  {
    slug: "coupon-25-friends",
    title: "25% off, for a friend",
    description:
      "A bigger code you can hand to someone else. Stock is limited, so it is worth the wait.",
    costXp: 900,
    kind: "coupon",
    value: "FRIENDS25",
    stock: 50,
    sortOrder: 6,
  },
];

export function rewardBySlug(slug: string): RewardSeed | undefined {
  return REWARDS.find((reward) => reward.slug === slug);
}
