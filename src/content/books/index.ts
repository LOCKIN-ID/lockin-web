import { assertBooksContent } from "../assert";
import { beginner } from "./beginner";
import { expert } from "./expert";
import { intermediate } from "./intermediate";
import type { BookContent } from "../types";

/**
 * Every book, validated at import time: a content file that dangles a quest slug
 * or drifts a page number fails the build instead of rendering a hole.
 */
export const books: BookContent[] = [beginner, intermediate, expert];

assertBooksContent(books);

export function getBook(slug: string): BookContent | undefined {
  return books.find((book) => book.slug === slug);
}

export function bookSlugs(): string[] {
  return books.map((book) => book.slug);
}
