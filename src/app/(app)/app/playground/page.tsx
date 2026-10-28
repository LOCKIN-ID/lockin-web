import type { Metadata } from "next";
import { AppPlayground } from "./app-playground";
import { requireUser } from "@/lib/auth";
import { books } from "@/content/books";
import { accessFor, canOpen } from "@/lib/entitlements";
import { bookPrice } from "@/content/plans";
import type { Exercise } from "@/components/playground/exercise-list";
import type { PanelLang } from "@/lib/playground/snippets";

export const metadata: Metadata = {
  title: "Playground | LOCK.IN",
  description: "In-browser coding workspace with Python, Linux Shell, JavaScript, and HTML.",
};

export default async function AppPlaygroundPage() {
  const session = await requireUser();
  const access = await accessFor(session.user.id);

  // Extract runnable code blocks from all books the user has access to
  const exercises: Exercise[] = [];

  for (const book of books) {
    if (!canOpen(access, { slug: book.slug, priceIdr: bookPrice(book.slug) })) continue;

    for (const chapter of book.chapters) {
      for (const section of chapter.sections) {
        let blockIndex = 0;
        for (const block of section.body) {
          if (block.kind === "code" && block.runnable) {
            exercises.push({
              id: `${book.slug}-${chapter.id}-${section.id}-${blockIndex}`,
              bookSlug: book.slug,
              bookTitle: book.title,
              chapterTitle: chapter.title,
              sectionTitle: section.title,
              lang: block.lang as PanelLang,
              code: block.code,
            });
            blockIndex++;
          }
        }
      }
    }
  }

  return <AppPlayground userId={session.user.id} exercises={exercises} />;
}
