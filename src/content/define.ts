import type { BookContent, BookDraft, ChapterDraft } from "./types";

/**
 * Print pagination, derived so an author never writes a page number by hand.
 *
 * A chapter's print length follows its reading time at ten minutes a page, with
 * a two-page floor for a chapter that reads fast but carries figures. Front
 * matter is cover, "how to read this", and the roadmap; the cheatsheet is one
 * page on its own. The arithmetic is the reason every book lands between 15 and
 * 25 pages, the deck's promise.
 */

export const FRONT_MATTER_PAGES = 3;
export const CHEATSHEET_PAGES = 1;
export const MIN_PAGE_COUNT = 15;
export const MAX_PAGE_COUNT = 25;

export function chapterPageCount(chapter: ChapterDraft): number {
  return Math.max(2, Math.round(chapter.minutes / 10));
}

/** Total print pages of a book, before `pdfPage` is stamped on each chapter. */
export function printPageCount(draft: Pick<BookDraft, "chapters">): number {
  return (
    FRONT_MATTER_PAGES +
    CHEATSHEET_PAGES +
    draft.chapters.reduce((total, chapter) => total + chapterPageCount(chapter), 0)
  );
}

/**
 * Finish a book: stamp each chapter's `pdfPage` (1-based, in reading order) and
 * the book's `pageCount`. Idempotent, so a caller may define a book once at
 * module scope and pass it around.
 */
export function defineBook(draft: BookDraft): BookContent {
  let cursor = FRONT_MATTER_PAGES + 1;
  const chapters = draft.chapters.map((chapter) => {
    const pdfPage = cursor;
    cursor += chapterPageCount(chapter);
    const sections = chapter.sections.map((sec) => ({
      ...sec,
      summary: sec.summary ?? sec.title,
      blocks: sec.blocks ?? sec.body,
    }));
    return { ...chapter, sections, pdfPage };
  });

  const priceIdr = draft.slug === "beginner" ? 0 : draft.slug === "intermediate" ? 99000 : 149000;

  const cheatsheets = draft.cheatsheets.map((cs, idx) => ({
    ...cs,
    syntax: cs.syntax ?? cs.snippet?.code ?? cs.term,
    purpose: cs.purpose ?? cs.meaning,
    introducedInChapter: cs.introducedInChapter ?? Math.min(6, Math.floor(idx / 3) + 1),
  }));

  const quests = draft.quests.map((q) => ({
    ...q,
    xpReward: q.xpReward ?? q.xp,
  }));

  return {
    ...draft,
    blurb: draft.promise,
    priceIdr,
    chapters,
    cheatsheets,
    quests,
    pageCount: printPageCount(draft),
  };
}
