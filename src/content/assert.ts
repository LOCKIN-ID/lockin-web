import { MAX_PAGE_COUNT, MIN_PAGE_COUNT, chapterPageCount, printPageCount, FRONT_MATTER_PAGES } from "./define";
import type { Block, BookContent, QuestKind } from "./types";

/**
 * Break the build rather than render a hole.
 *
 * Every rule here is a link that can dangle: a `questGate` pointing at a quest
 * that no longer exists, a `keyword` with no cheatsheet entry, a chapter whose
 * derived page numbers drifted. Each failure names the offending id, so a
 * broken content file is a one-line fix and never a missing card in the reader.
 */

const SLUG = /^[a-z][a-z0-9-]*$/;
const QUEST_CODE = /^[A-Z0-9]{6}$/;
const ID = /^[a-z][a-z0-9-]*$/;
const QUEST_KINDS: QuestKind[] = ["quiz", "repo", "bank_soal"];
const MAX_CODE_LINES = 20;

function fail(book: BookContent, message: string): never {
  throw new Error(`[content] ${book.slug}: ${message}`);
}

function assertUnique(book: BookContent, kind: string, ids: string[]): void {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) fail(book, `duplicate ${kind} "${id}"`);
    seen.add(id);
  }
}

function assertBody(book: BookContent, where: string, body: Block[], terms: Set<string>, questSlugs: Set<string>): void {
  if (body.length === 0) fail(book, `${where} has an empty body`);
  for (const block of body) {
    switch (block.kind) {
      case "text":
        if (block.md.trim().length === 0) fail(book, `${where} has an empty text block`);
        break;
      case "code": {
        if (block.code.trim().length === 0) fail(book, `${where} has an empty code block`);
        const lines = block.code.replace(/\n+$/, "").split("\n").length;
        if (lines > MAX_CODE_LINES) {
          fail(book, `${where} has a code block of ${lines} lines (limit ${MAX_CODE_LINES})`);
        }
        if (!block.runnable && !block.caption) {
          fail(book, `${where} has a read-only code block with no caption saying so`);
        }
        break;
      }
      case "callout":
        if (!block.title.trim()) fail(book, `${where} has a callout with no title`);
        if (!block.md.trim()) fail(book, `${where} has a callout "${block.title}" with no body`);
        break;
      case "figure":
        if (block.figure === "qr" && !block.questSlug) {
          fail(book, `${where} has a qr figure with no quest slug`);
        }
        if (block.figure === "qr" && block.questSlug && !questSlugs.has(block.questSlug)) {
          fail(book, `${where} points at quest "${block.questSlug}", which is not in this book`);
        }
        break;
      case "keyword":
        if (!terms.has(block.term)) {
          fail(book, `${where} points at keyword "${block.term}", which has no cheatsheet entry`);
        }
        break;
      case "questGate":
        if (!questSlugs.has(block.questSlug)) {
          fail(book, `${where} points at quest "${block.questSlug}", which is not in this book`);
        }
        break;
    }
  }
}

export function assertBookContent(book: BookContent): void {
  if (!SLUG.test(book.slug)) fail(book, `slug "${book.slug}" is not a slug`);
  for (const [field, value] of [["title", book.title], ["levelLabel", book.levelLabel], ["promise", book.promise]] as const) {
    if (!value || !value.trim()) fail(book, `${field} is empty`);
  }
  if (book.pageCount < MIN_PAGE_COUNT || book.pageCount > MAX_PAGE_COUNT) {
    fail(book, `pageCount ${book.pageCount} is outside ${MIN_PAGE_COUNT} to ${MAX_PAGE_COUNT} print pages`);
  }
  if (book.pageCount !== printPageCount(book)) {
    fail(book, `pageCount ${book.pageCount} is not the ${printPageCount(book)} its chapters derive`);
  }
  if (book.chapters.length === 0) fail(book, "has no chapters");

  assertUnique(
    book,
    "chapter id",
    book.chapters.map((chapter) => chapter.id),
  );
  assertUnique(
    book,
    "section id",
    book.chapters.flatMap((chapter) => chapter.sections.map((section) => section.id)),
  );
  assertUnique(
    book,
    "quiz item id",
    book.chapters.flatMap((chapter) => chapter.checkpoint.items.map((item) => item.id)),
  );
  assertUnique(
    book,
    "quest slug",
    book.quests.map((quest) => quest.slug),
  );
  assertUnique(
    book,
    "quest code",
    book.quests.map((quest) => quest.code),
  );
  assertUnique(
    book,
    "roadmap node id",
    book.roadmap.map((node) => node.id),
  );
  assertUnique(
    book,
    "cheatsheet term",
    book.cheatsheets.map((entry) => entry.term),
  );

  const questSlugs = new Set(book.quests.map((quest) => quest.slug));
  const terms = new Set(book.cheatsheets.map((entry) => entry.term));
  const chapterIds = new Set(book.chapters.map((chapter) => chapter.id));

  let cursor = FRONT_MATTER_PAGES + 1;
  for (const chapter of book.chapters) {
    if (!ID.test(chapter.id)) fail(book, `chapter id "${chapter.id}" is not an id`);
    if (!chapter.title.trim()) fail(book, `chapter "${chapter.id}" has no title`);
    if (!chapter.goal.trim()) fail(book, `chapter "${chapter.id}" has no goal`);
    if (chapter.minutes < 5) fail(book, `chapter "${chapter.id}" reads in ${chapter.minutes} minutes`);
    if (chapter.pdfPage !== cursor) {
      fail(book, `chapter "${chapter.id}" says print page ${chapter.pdfPage}, its place in the order is ${cursor}`);
    }
    cursor += chapterPageCount(chapter);
    if (chapter.sections.length !== 3) {
      fail(book, `chapter "${chapter.id}" has ${chapter.sections.length} sections, three is the shape`);
    }
    for (const section of chapter.sections) {
      if (!ID.test(section.id)) fail(book, `section id "${section.id}" is not an id`);
      if (!section.title.trim()) fail(book, `section "${section.id}" has no title`);
      if (section.minutes < 1) fail(book, `section "${section.id}" reads in ${section.minutes} minutes`);
      assertBody(book, `section "${section.id}"`, section.body, terms, questSlugs);
    }
    const { checkpoint } = chapter;
    if (!checkpoint.id.trim() || !checkpoint.title.trim()) {
      fail(book, `chapter "${chapter.id}" has an unnamed checkpoint`);
    }
    if (!(checkpoint.passRatio > 0 && checkpoint.passRatio <= 1)) {
      fail(book, `checkpoint "${checkpoint.id}" passes at ${checkpoint.passRatio}`);
    }
    if (checkpoint.xp < 0) fail(book, `checkpoint "${checkpoint.id}" awards ${checkpoint.xp} XP`);
    if (checkpoint.items.length < 3) {
      fail(book, `checkpoint "${checkpoint.id}" has ${checkpoint.items.length} items, three is the floor`);
    }
    for (const item of checkpoint.items) {
      if (!ID.test(item.id)) fail(book, `quiz item id "${item.id}" is not an id`);
      if (!item.prompt.trim()) fail(book, `quiz item "${item.id}" has no prompt`);
      if (item.options.length < 2) fail(book, `quiz item "${item.id}" offers ${item.options.length} options`);
      if (item.answerIndex < 0 || item.answerIndex >= item.options.length) {
        fail(book, `quiz item "${item.id}" answers option ${item.answerIndex} of ${item.options.length}`);
      }
      if (!item.explanation.trim()) fail(book, `quiz item "${item.id}" has no explanation`);
      if (!item.hint.trim()) fail(book, `quiz item "${item.id}" has no hint for the coach`);
    }
  }

  if (book.quests.length === 0) fail(book, "has no quests");
  for (const quest of book.quests) {
    if (!SLUG.test(quest.slug)) fail(book, `quest slug "${quest.slug}" is not a slug`);
    if (!QUEST_CODE.test(quest.code)) fail(book, `quest "${quest.slug}" code "${quest.code}" is not six uppercase characters`);
    if (!quest.title.trim()) fail(book, `quest "${quest.slug}" has no title`);
    if (quest.xp < 0) fail(book, `quest "${quest.slug}" awards ${quest.xp} XP`);
    if (!chapterIds.has(quest.chapterId)) {
      fail(book, `quest "${quest.slug}" sits in chapter "${quest.chapterId}", which is not in this book`);
    }
    if (!QUEST_KINDS.includes(quest.kind)) fail(book, `quest "${quest.slug}" has kind "${quest.kind}"`);
  }
  for (const kind of QUEST_KINDS) {
    if (!book.quests.some((quest) => quest.kind === kind)) fail(book, `has no ${kind} quest`);
  }

  const nodeIds = new Set(book.roadmap.map((node) => node.id));
  for (const node of book.roadmap) {
    if (!ID.test(node.id)) fail(book, `roadmap node id "${node.id}" is not an id`);
    if (!node.title.trim()) fail(book, `roadmap node "${node.id}" has no title`);
    if (node.bookSlug !== book.slug) {
      fail(book, `roadmap node "${node.id}" belongs to book "${node.bookSlug}"`);
    }
    if (!chapterIds.has(node.chapterId)) {
      fail(book, `roadmap node "${node.id}" teaches chapter "${node.chapterId}", which is not in this book`);
    }
    if (!node.teaches.length) fail(book, `roadmap node "${node.id}" teaches nothing`);
    if (node.requires.includes(node.id)) fail(book, `roadmap node "${node.id}" requires itself`);
  }
  assertAcyclic(book, nodeIds);

  for (const entry of book.cheatsheets) {
    if (!entry.term.trim()) fail(book, "has a cheatsheet entry with no term");
    if (!entry.meaning.trim()) fail(book, `cheatsheet term "${entry.term}" has no meaning`);
  }
}

/** A `requires` cycle would make the roadmap panel undrawable, so it is a failure. */
function assertAcyclic(book: BookContent, nodeIds: Set<string>): void {
  const edges = new Map(book.roadmap.map((node) => [node.id, node.requires]));
  const state = new Map<string, "open" | "closed">();
  const walk = (id: string, path: string[]): void => {
    if (state.get(id) === "closed") return;
    if (state.get(id) === "open") {
      fail(book, `roadmap cycle: ${[...path, id].join(" -> ")}`);
    }
    state.set(id, "open");
    for (const next of edges.get(id) ?? []) walk(next, [...path, id]);
    state.set(id, "closed");
  };
  for (const id of nodeIds) walk(id, []);
}

export function assertBooksContent(books: BookContent[]): void {
  for (const book of books) assertBookContent(book);
  assertUniqueBooks(books);

  // A `requires` edge may cross books: that is the shape of the roadmap's
  // three lanes: so the link check needs the whole set, and so does the walk
  // that proves there is no cycle through two books.
  const nodes = books.flatMap((book) => book.roadmap);
  const ids = new Set(nodes.map((node) => node.id));
  for (const node of nodes) {
    for (const required of node.requires) {
      if (!ids.has(required)) {
        throw new Error(`[content] roadmap node "${node.id}" requires "${required}", which is not a node in any book`);
      }
    }
  }
  const edges = new Map(nodes.map((node) => [node.id, node.requires]));
  const state = new Map<string, "open" | "closed">();
  const walk = (id: string, path: string[]): void => {
    if (state.get(id) === "closed") return;
    if (state.get(id) === "open") {
      throw new Error(`[content] roadmap cycle: ${[...path, id].join(" -> ")}`);
    }
    state.set(id, "open");
    for (const next of edges.get(id) ?? []) walk(next, [...path, id]);
    state.set(id, "closed");
  };
  for (const id of ids) walk(id, []);
}

function assertUniqueBooks(books: BookContent[]): void {
  const slugs = new Set<string>();
  const codes = new Set<string>();
  const nodeIds = new Set<string>();
  for (const book of books) {
    if (slugs.has(book.slug)) throw new Error(`[content] duplicate book slug "${book.slug}"`);
    slugs.add(book.slug);
    for (const quest of book.quests) {
      if (codes.has(quest.code)) throw new Error(`[content] quest code "${quest.code}" is used twice`);
      codes.add(quest.code);
    }
    for (const node of book.roadmap) {
      if (nodeIds.has(node.id)) throw new Error(`[content] roadmap node "${node.id}" is used twice`);
      nodeIds.add(node.id);
    }
  }
}
