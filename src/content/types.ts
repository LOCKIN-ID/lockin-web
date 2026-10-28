/**
 * The content model for LOCK.IN's e-books.
 *
 * The books are typed TypeScript modules versioned in git, not rows: the reader
 * stays fast, a chapter is diffable, and a typo is fixed without a migration.
 * The database keeps only the metadata (`Book`) and each reader's progress,
 * keyed by the same string ids these types carry.
 */

export type Lang = "html" | "js" | "python" | "shell";

export type BookTier = "beginner" | "intermediate" | "expert";

/** A QR-gated quest's kind, mirroring `Quest.kind` in `prisma/schema.prisma`. */
export type QuestKind = "quiz" | "repo" | "bank_soal";

/** One block of a section's body. The reader maps each `kind` to a component. */
export type Block =
  | { kind: "text"; md: string }
  | { kind: "code"; lang: Lang; code: string; runnable: boolean; caption?: string }
  | { kind: "callout"; tone: "tip" | "trap" | "fact"; title: string; md: string }
  | {
      kind: "figure";
      figure: "spark" | "leaf" | "blob" | "roadmap" | "qr";
      caption: string;
      questSlug?: string;
    }
  /** An inline chip that opens the cheatsheet drawer, scrolled to `term`. */
  | { kind: "keyword"; term: string }
  /** An inline "scan or type the code" card. */
  | { kind: "questGate"; questSlug: string };

export interface QuizItem {
  id: string;
  prompt: string;
  options: string[];
  answerIndex: number;
  /** Shown the moment the item is answered wrong or right. */
  explanation: string;
  /** What the Socratic coach reaches for at level 2, before the answer. */
  hint: string;
  /** Substrings that mark a plausible wrong answer, for the coach's diagnosis. */
  errorSignatures?: string[];
}

export interface Section {
  id: string;
  title: string;
  minutes: number;
  body: Block[];
  summary?: string;
  blocks?: Block[];
}

export interface Checkpoint {
  id: string;
  title: string;
  /** Share of items that must be right to pass; the reader uses 0.7. */
  passRatio: number;
  xp: number;
  items: QuizItem[];
}

export interface Chapter {
  id: string;
  title: string;
  minutes: number;
  /** One line, what the reader can do after the chapter. */
  goal: string;
  sections: Section[];
  checkpoint: Checkpoint;
  /** The print page the chapter starts on; `defineBook` derives it. */
  pdfPage: number;
}

export interface CheatsheetEntry {
  term: string;
  meaning: string;
  snippet?: { lang: Lang; code: string };
  syntax?: string;
  purpose?: string;
  introducedInChapter?: number;
}

export interface RoadmapNode {
  id: string;
  title: string;
  tier: BookTier;
  /** Other node ids that come first; must be real edges, not decoration. */
  requires: string[];
  teaches: string[];
  bookSlug: string;
  chapterId: string;
}

export interface BookQuest {
  slug: string;
  /** The 6 uppercase characters printed under the QR code. */
  code: string;
  title: string;
  kind: QuestKind;
  targetUrl?: string;
  payload?: Record<string, unknown>;
  xp: number;
  xpReward?: number;
  chapterId: string;
}

export interface BookContent {
  slug: string;
  title: string;
  tier: BookTier;
  /** The deck's label for the tier: "Start here", "Build things", "Spesialis Riko". */
  levelLabel: string;
  /** One sentence: what the reader can build when the book is done. */
  promise: string;
  blurb?: string;
  priceIdr?: number;
  /** Print pages, 15 to 25; derived from the chapters by `defineBook`. */
  pageCount: number;
  chapters: Chapter[];
  cheatsheets: CheatsheetEntry[];
  roadmap: RoadmapNode[];
  quests: BookQuest[];
}

/** What an author writes: `defineBook` derives `pdfPage` and `pageCount`. */
export interface BookDraft extends Omit<BookContent, "chapters" | "pageCount" | "blurb" | "priceIdr"> {
  chapters: ChapterDraft[];
}

export type ChapterDraft = Omit<Chapter, "pdfPage">;
