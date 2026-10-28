import { describe, expect, it } from "vitest";

import { assertBookContent } from "../src/content/assert";
import { printPageCount } from "../src/content/define";
import { books, getBook } from "../src/content";
import type { Block, BookContent, BookDraft, ChapterDraft, QuestKind } from "../src/content/types";
import { defineBook } from "../src/content/define";

/**
 * A book that satisfies every rule, so each case below can break exactly one
 * thing and prove the validator names it.
 */
function makeChapter(number: number, minutes: number): ChapterDraft {
  const sectionMinutes = Math.round(minutes / 3);
  return {
    id: `ch-${number}`,
    title: `Chapter ${number}`,
    minutes,
    goal: `After this you can do thing ${number}.`,
    sections: [1, 2, 3].map((n) => ({
      id: `ch-${number}-s${n}`,
      title: `Section ${number}.${n}`,
      minutes: sectionMinutes,
      body: [
        { kind: "text", md: "Some prose with `code` in it." },
        { kind: "keyword", term: "markup" },
        { kind: "code", lang: "html", code: "<p>hi</p>", runnable: true },
      ] as Block[],
    })),
    checkpoint: {
      id: `ch-${number}-check`,
      title: `Check ${number}`,
      passRatio: 0.7,
      xp: 25,
      items: [1, 2, 3].map((n) => ({
        id: `ch-${number}-q${n}`,
        prompt: `Question ${n}?`,
        options: ["right", "wrong"],
        answerIndex: 0,
        explanation: "Because the first one is right.",
        hint: "Look at the first option again.",
      })),
    },
  };
}

function makeDraft(minutes: number[] = [30, 30, 30, 30, 20, 20]): BookDraft {
  const kinds: QuestKind[] = ["quiz", "repo", "bank_soal"];
  return {
    slug: "test-book",
    title: "Test Book",
    tier: "beginner",
    levelLabel: "Start here",
    promise: "You can build the thing.",
    chapters: minutes.map((value, index) => makeChapter(index + 1, value)),
    cheatsheets: [{ term: "markup", meaning: "Text with tags in it." }],
    roadmap: [
      { id: "node-a", title: "First", tier: "beginner", requires: [], teaches: ["markup"], bookSlug: "test-book", chapterId: "ch-1" },
      { id: "node-b", title: "Second", tier: "beginner", requires: ["node-a"], teaches: ["style"], bookSlug: "test-book", chapterId: "ch-2" },
    ],
    quests: kinds.map((kind, index) => ({
      slug: `quest-${kind.replace(/_/g, "-")}`,
      code: `ABC12${index}`,
      title: `Quest ${kind}`,
      kind,
      xp: 10,
      chapterId: "ch-1",
    })),
  };
}

function makeBook(minutes?: number[]): BookContent {
  return defineBook(makeDraft(minutes));
}

function bodyOf(book: BookContent): Block[] {
  return book.chapters[0].sections[0].body;
}

describe("assertBookContent", () => {
  it("accepts a book that breaks nothing", () => {
    const book = makeBook();
    expect(book.pageCount).toBe(20);
    expect(() => assertBookContent(book)).not.toThrow();
  });

  it("names a duplicated section id", () => {
    const book = makeBook();
    book.chapters[1].sections[0].id = book.chapters[0].sections[0].id;
    expect(() => assertBookContent(book)).toThrow(/duplicate section id "ch-1-s1"/);
  });

  it("names a quest slug a quest gate points at but the book does not hold", () => {
    const book = makeBook();
    bodyOf(book).push({ kind: "questGate", questSlug: "missing-quest" });
    expect(() => assertBookContent(book)).toThrow(/points at quest "missing-quest"/);
  });

  it("names a keyword with no cheatsheet entry", () => {
    const book = makeBook();
    bodyOf(book).push({ kind: "keyword", term: "closure" });
    expect(() => assertBookContent(book)).toThrow(/keyword "closure", which has no cheatsheet entry/);
  });

  it("rejects a pagination of thirty print pages", () => {
    const book = makeBook([45, 45, 40, 40, 40, 40]);
    expect(book.pageCount).toBe(30);
    expect(() => assertBookContent(book)).toThrow(/pageCount 30 is outside 15 to 25/);
  });

  it("names a code block past the twenty-line limit", () => {
    const book = makeBook();
    bodyOf(book).push({
      kind: "code",
      lang: "js",
      code: Array.from({ length: 21 }, (_, line) => `line ${line}`).join("\n"),
      runnable: true,
    });
    expect(() => assertBookContent(book)).toThrow(/section "ch-1-s1" has a code block of 21 lines/);
  });

  it("rejects a roadmap whose nodes require each other in a cycle", () => {
    const book = makeBook();
    book.roadmap[0].requires = ["node-b"];
    expect(() => assertBookContent(book)).toThrow(/roadmap cycle: node-a -> node-b -> node-a/);
  });

  it("checks the chapter order against the page numbers, not the numbers alone", () => {
    const book = makeBook();
    book.chapters[2].pdfPage = 4;
    expect(() => assertBookContent(book)).toThrow(/chapter "ch-3" says print page 4, its place in the order is 10/);
  });
});

describe("the shipped books", () => {
  it("holds the three tiers, once each, with a printable length", () => {
    expect(books.map((book) => book.slug)).toEqual(["beginner", "intermediate", "expert"]);
    expect(new Set(books.map((book) => book.tier)).size).toBe(3);
    for (const book of books) {
      expect(printPageCount(book)).toBe(book.pageCount);
      expect(book.pageCount).toBeGreaterThanOrEqual(18);
      expect(book.pageCount).toBeLessThanOrEqual(22);
      expect(book.chapters).toHaveLength(6);
    }
  });

  it("carries at least thirty checkpoint items across the set", () => {
    const items = books.flatMap((book) => book.chapters.flatMap((chapter) => chapter.checkpoint.items));
    expect(items.length).toBeGreaterThanOrEqual(30);
    for (const item of items) {
      expect(item.hint.length).toBeGreaterThan(0);
      expect(item.explanation.length).toBeGreaterThan(0);
    }
  });

  it("keeps every code block inside the twenty-line limit and labelled", () => {
    for (const book of books) {
      for (const chapter of book.chapters) {
        for (const section of chapter.sections) {
          for (const block of section.body) {
            if (block.kind !== "code") continue;
            expect(block.code.replace(/\n+$/, "").split("\n").length).toBeLessThanOrEqual(20);
            if (!block.runnable) expect(block.caption).toBeTruthy();
          }
        }
      }
    }
  });

  it("resolves a book by slug and nothing else", () => {
    expect(getBook("expert")?.tier).toBe("expert");
    expect(getBook("nope")).toBeUndefined();
  });
});
