import type { Lang } from "@/lib/playground/runtime-protocol";

/**
 * The eleven badges, and the rules the evaluator reads. Rules are data so
 * `/app/badges` can show real numbers (`4/7`, not a fake bar) and so the seed and the
 * runtime agree on exactly one definition of "unlocked".
 *
 * Rule shapes and the evaluator that consumes them live together: `src/lib/gamification/badges.ts`.
 */
export type BadgeRule =
  | { kind: "runs"; count: number } // successful playground runs
  | { kind: "runs-in-languages"; languages: Lang[] } // at least one successful run in each
  | { kind: "sections"; count: number } // finished reader sections
  | { kind: "book-sections"; books: number } // every section of this many books
  | { kind: "checkpoint-perfect"; count: number } // checkpoints answered with score == total
  | { kind: "streak"; days: number }
  | { kind: "quests"; count: number }
  | { kind: "level"; level: number }
  | { kind: "night-run"; fromHour: number; toHour: number }; // Asia/Jakarta

export type BadgeKind = "progress" | "streak" | "skill" | "community";

export interface BadgeSeed {
  slug: string;
  title: string;
  /** One line the reader can check against. No "keep going!", just the condition. */
  requirement: string;
  kind: BadgeKind;
  xpReward: number;
  sortOrder: number;
  rule: BadgeRule;
}

export const BADGES: BadgeSeed[] = [
  {
    slug: "hello-world",
    title: "First Light",
    requirement: "Run one snippet that exits cleanly.",
    kind: "skill",
    xpReward: 5,
    sortOrder: 1,
    rule: { kind: "runs", count: 1 },
  },
  {
    slug: "first-section",
    title: "Page One",
    requirement: "Finish one section of any book.",
    kind: "progress",
    xpReward: 5,
    sortOrder: 2,
    rule: { kind: "sections", count: 1 },
  },
  {
    slug: "clean-checkpoint",
    title: "Clean Sheet",
    requirement: "Pass a checkpoint with every question right.",
    kind: "skill",
    xpReward: 15,
    sortOrder: 3,
    rule: { kind: "checkpoint-perfect", count: 1 },
  },
  {
    slug: "streak-3",
    title: "Three in a Row",
    requirement: "Practise three days in a row.",
    kind: "streak",
    xpReward: 10,
    sortOrder: 4,
    rule: { kind: "streak", days: 3 },
  },
  {
    slug: "polyglot",
    title: "Four Tongues",
    requirement: "One clean run in HTML, JavaScript, Python and the shell.",
    kind: "skill",
    xpReward: 30,
    sortOrder: 5,
    rule: { kind: "runs-in-languages", languages: ["html", "js", "python", "shell"] },
  },
  {
    slug: "night-owl",
    title: "Night Owl",
    requirement: "Run something between midnight and 4am Jakarta time.",
    kind: "skill",
    xpReward: 10,
    sortOrder: 6,
    rule: { kind: "night-run", fromHour: 0, toHour: 4 },
  },
  {
    slug: "quest-hunter",
    title: "Quest Hunter",
    requirement: "Complete five quests.",
    kind: "community",
    xpReward: 20,
    sortOrder: 7,
    rule: { kind: "quests", count: 5 },
  },
  {
    slug: "level-5",
    title: "Level Five",
    requirement: "Reach level 5.",
    kind: "progress",
    xpReward: 25,
    sortOrder: 8,
    rule: { kind: "level", level: 5 },
  },
  {
    slug: "streak-7",
    title: "Week Locked",
    requirement: "Practise seven days in a row.",
    kind: "streak",
    xpReward: 20,
    sortOrder: 9,
    rule: { kind: "streak", days: 7 },
  },
  {
    slug: "book-finisher",
    title: "Finisher",
    requirement: "Finish every section of one book.",
    kind: "progress",
    xpReward: 40,
    sortOrder: 10,
    rule: { kind: "book-sections", books: 1 },
  },
  {
    slug: "streak-30",
    title: "Thirty Days Deep",
    requirement: "Practise thirty days in a row.",
    kind: "streak",
    xpReward: 40,
    sortOrder: 11,
    rule: { kind: "streak", days: 30 },
  },
];

export function badgeBySlug(slug: string): BadgeSeed | undefined {
  return BADGES.find((badge) => badge.slug === slug);
}
