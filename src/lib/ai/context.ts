import { getBook } from "@/content/books";
import { HELP_ARTICLES } from "@/content/help";
import type { TutorContext } from "./socratic";

/**
 * Builds context for the Socratic AI tutor.
 * Capped at 6 KB to ensure fast streaming and strict token hygiene.
 */
export function buildTutorContext(
  bookSlug?: string,
  chapterId?: string,
  sectionId?: string,
): TutorContext {
  if (!bookSlug) return {};

  const book = getBook(bookSlug);
  if (!book) return {};
  const chapter = chapterId ? book.chapters.find((ch) => ch.id === chapterId) : book.chapters[0];
  const section = sectionId && chapter ? chapter.sections.find((s) => s.id === sectionId) : undefined;
  const keywords = book.cheatsheets.map((cs) => cs.term);
  const hints = chapter?.checkpoint?.items?.map((it) => it.hint) ?? [];

  return {
    bookSlug: book.slug,
    bookTitle: book.title,
    chapterId: chapter?.id,
    chapterTitle: chapter?.title,
    sectionId: section?.id,
    sectionTitle: section?.title,
    keywords: keywords.slice(0, 15),
    hints: hints.slice(0, 5),
  };
}

/**
 * Context for support persona: retrieves matching help articles using keyword overlap scoring.
 */
export function buildSupportContext(query: string): string {
  const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);

  const scored = HELP_ARTICLES.map((article) => {
    let score = 0;
    const hay = `${article.title} ${article.summary} ${article.keywords}`.toLowerCase();
    for (const w of words) {
      if (hay.includes(w)) score++;
    }
    return { article, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 3).filter((s) => s.score > 0);

  if (top.length === 0) {
    return "No directly matching articles. Escalate to opening a ticket or WhatsApp.";
  }

  return top
    .map((s) => `Article: ${s.article.title}\nSummary: ${s.article.summary}\nURL: /help/${s.article.slug}`)
    .join("\n\n");
}
