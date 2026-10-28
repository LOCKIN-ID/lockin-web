"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { saveSnippet } from "@/app/(marketing)/playground/actions";
import type { PanelLang } from "@/lib/playground/snippets";

/**
 * The exercise shelf: every runnable `code` block of the books this reader owns, lifted
 * out of `@/content` by the page rather than copied here, so the book and the playground
 * can never disagree about what an exercise is.
 *
 * Two actions per row, both explicit. `Load exercise` is the only thing that touches the
 * editor; `Save to my snippets` files a copy under a name derived from where the block
 * lives, so a reader who saves twice gets two attempts rather than one silent overwrite.
 * Both labels report their own outcome, which is why neither action raises a toast.
 */

export interface Exercise {
  /** Stable across renders: book, chapter, section and the block's place in the section. */
  id: string;
  bookSlug: string;
  bookTitle: string;
  chapterTitle: string;
  sectionTitle: string;
  lang: PanelLang;
  code: string;
  caption?: string;
}

export interface ExerciseListProps {
  exercises: Exercise[];
  /** Fills the editor with this block, and switches the panel to its language. */
  onLoad: (exercise: Exercise) => void;
}

interface BookGroup {
  slug: string;
  title: string;
  items: Exercise[];
}

/** Grouped in content order, so the shelf reads in the order the books teach. */
function groupByBook(exercises: Exercise[]): BookGroup[] {
  const groups: BookGroup[] = [];
  for (const exercise of exercises) {
    const group = groups.find((candidate) => candidate.slug === exercise.bookSlug);
    if (group) group.items.push(exercise);
    else groups.push({ slug: exercise.bookSlug, title: exercise.bookTitle, items: [exercise] });
  }
  return groups;
}

/** `Title` in the schema caps at 80 characters, so the shelf trims rather than fails. */
function snippetTitle(exercise: Exercise): string {
  const where = exercise.caption?.trim() || exercise.chapterTitle;
  return `${exercise.bookTitle}: ${where}`.slice(0, 80);
}

/** The caption when the author wrote one, otherwise the block's first line, as code. */
function summary(exercise: Exercise): string {
  const caption = exercise.caption?.trim();
  if (caption) return caption;
  return exercise.code.split("\n")[0] ?? "";
}

export function ExerciseList({ exercises, onLoad }: ExerciseListProps) {
  const router = useRouter();
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [note, setNote] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const groups = groupByBook(exercises);

  async function save(exercise: Exercise) {
    setBusyId(exercise.id);
    setNote(null);
    const result = await saveSnippet({
      title: snippetTitle(exercise),
      language: exercise.lang,
      code: exercise.code,
    });
    setBusyId(null);
    if (result.ok) {
      setNote({ tone: "ok", text: `"${result.snippet?.title ?? snippetTitle(exercise)}" is in your snippets.` });
      router.refresh();
      return;
    }
    setNote({ tone: "error", text: result.reason ?? "That exercise could not be saved." });
  }

  return (
    <section className="panel grid gap-4 p-4" aria-labelledby="exercise-list-head">
      <div className="grid gap-1">
        <h2 id="exercise-list-head" className="text-title">
          Exercises from your books
        </h2>
        <p className="text-xs text-muted">
          Every runnable block in a book you own. Loading one drops it into the editor above.
        </p>
      </div>

      {note ? (
        <p role="status" className={note.tone === "error" ? "text-xs text-error" : "text-xs text-ink-2"}>
          {note.text}
        </p>
      ) : null}

      {groups.length === 0 ? (
        <div className="well grid gap-2 p-3">
          <p className="text-sm text-ink-2">
            No runnable blocks in the books you own yet. They appear here the moment a book is unlocked.
          </p>
          <Link href="/books" className="btn btn--quiet btn--sm justify-self-start">
            See the catalogue
          </Link>
        </div>
      ) : (
        groups.map((group) => (
          <details key={group.slug} open className="grid gap-2">
            <summary className="flex cursor-pointer flex-wrap items-baseline gap-2">
              <span className="text-sm">{group.title}</span>
              <span className="text-xs text-muted">{group.items.length} blocks</span>
            </summary>
            <ul className="grid">
              {group.items.map((exercise) => (
                <li key={exercise.id} className="grid gap-2 border-t border-rule py-3">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="chip font-outlier text-xs">{exercise.lang}</span>
                    <span className="text-sm">{exercise.chapterTitle}</span>
                    <span className="text-xs text-muted">{exercise.sectionTitle}</span>
                  </div>
                  <p className="line-clamp-2 font-outlier text-xs text-ink-2">{summary(exercise)}</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn--quiet btn--sm"
                      onClick={() => {
                        onLoad(exercise);
                        setLoadedId(exercise.id);
                        setNote(null);
                      }}
                    >
                      {loadedId === exercise.id ? "Loaded" : "Load exercise"}
                    </button>
                    <button
                      type="button"
                      className="btn btn--quiet btn--sm"
                      aria-busy={busyId === exercise.id}
                      disabled={busyId === exercise.id}
                      onClick={() => void save(exercise)}
                    >
                      {busyId === exercise.id ? "Saving..." : "Save to my snippets"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </details>
        ))
      )}
    </section>
  );
}
