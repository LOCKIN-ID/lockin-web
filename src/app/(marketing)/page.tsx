import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    absolute: "LOCK.IN",
  },
};

import { Hero } from "@/components/marketing/hero";
import { TaglineStrip } from "@/components/marketing/tagline-strip";
import { ScrollStoryline } from "@/components/marketing/scroll-storyline";
import { TornPaperEdge } from "@/components/brand/torn-paper";
import { books } from "@/content/books";
import { BADGES } from "@/content/badges";
import { REWARDS } from "@/content/rewards";
import { PLANS } from "@/content/plans";
import { priceLabel } from "@/lib/format";

/**
 * The landing page.
 *
 * Its composition rotates per band rather than repeating one grid: a pinned
 * scroll story, a shelf the books lean on, a printed code, a dark workbench,
 * a ladder of rungs, a ledger. Every number on it is read out of the content
 * modules at build time, so a claim cannot drift from the books it describes.
 *
 * Motion is the site's one reveal system (`data-reveal`, staggered inside a
 * `data-reveal-group`) plus the single scroll-choreography pattern in
 * `base.css` (`.scrolly`). Nothing else moves.
 */

/** Every figure a band prints, counted once from the books themselves. */
function libraryFacts() {
  let code = 0;
  let runnable = 0;
  let sections = 0;
  let quizItems = 0;
  let callouts = 0;

  for (const book of books) {
    for (const chapter of book.chapters) {
      sections += chapter.sections.length;
      quizItems += chapter.checkpoint.items.length;
      for (const section of chapter.sections) {
        for (const block of section.body) {
          if (block.kind === "code") {
            code += 1;
            if (block.runnable) runnable += 1;
          }
          if (block.kind === "callout") callouts += 1;
        }
      }
    }
  }

  return {
    books: books.length,
    chapters: books.reduce((total, book) => total + book.chapters.length, 0),
    sections,
    code,
    runnable,
    quizItems,
    callouts,
    quests: books.reduce((total, book) => total + book.quests.length, 0),
    cheatsheets: books.reduce((total, book) => total + book.cheatsheets.length, 0),
  };
}

const FACTS = libraryFacts();


const QUEST_KINDS = [
  { kind: "Quiz", body: "A checkpoint with explanations and XP." },
  { kind: "GitHub repo", body: "A starter repository, checked when you push." },
  { kind: "Bank soal", body: "A drill set for the chapter's syntax." },
];

const REWARD_FLOOR = Math.min(...REWARDS.map((reward) => reward.costXp));
const REWARD_CEILING = Math.max(...REWARDS.map((reward) => reward.costXp));

const FIRST_QUEST = books[0].quests[0];

export default function HomePage() {
  return (
    <>
      <Hero />
      <TaglineStrip
        tone="paper"
        items={[
          "10–15 PAGES PER BOOK",
          "100% RUNNABLE CODE",
          "INTEGRATED CHECKPOINTS",
          "WASM WORKBENCH",
          "ZERO SUBSCRIPTION TRAPS",
        ]}
      />
      <TornPaperEdge variant="paper-to-dark" index={0} />
      <ScrollStoryline
        books={books}
        firstQuest={FIRST_QUEST}
        facts={FACTS}
      />
      <TornPaperEdge variant="paper-to-dark" index={4} />
    </>
  );
}