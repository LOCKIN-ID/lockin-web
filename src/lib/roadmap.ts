/**
 * The roadmap, folded with one reader's progress.
 *
 * Every book carries its own `roadmap` array; this module stitches the three into one
 * graph in tier order and answers the two questions the product asks of it: what is done,
 * and what is the next thing (the dashboard's "continue" card, the weekly digest's one
 * suggestion).
 *
 * A node's progress is the sections of its chapter that the reader has finished. That is
 * the honest number: a node is not "done" because it was opened.
 */

import { books } from "@/content";
import { prisma } from "@/lib/prisma";
import type { BookTier, RoadmapNode } from "@/content/types";

export interface NodeState {
  node: RoadmapNode;
  bookTitle: string;
  bookSlug: string;
  tier: BookTier;
  chapterTitle: string;
  /** Finished sections in this node's chapter. */
  done: number;
  /** Sections in the chapter. */
  total: number;
  /** All of the chapter's sections are finished. */
  complete: boolean;
  /** Required nodes that are not complete yet. */
  lockedBy: NodeState[];
}

export interface RoadmapView {
  nodes: NodeState[];
  /** The next node whose requirements are met and which is unfinished, in tier order. */
  next: NodeState | null;
  completed: number;
}

function chapterOf(bookSlug: string, chapterId: string) {
  const book = books.find((candidate) => candidate.slug === bookSlug);
  const chapter = book?.chapters.find((candidate) => candidate.id === chapterId);
  return book && chapter ? { book, chapter } : null;
}

/** Every node, with the reader's progress. `userId` may be null (signed out → all zero). */
export async function roadmap(userId?: string | null): Promise<RoadmapView> {
  const progress = userId
    ? await prisma.readingProgress.groupBy({
        by: ["bookSlug", "chapterId"],
        where: { userId, completedAt: { not: null } },
        _count: { _all: true },
      })
    : [];

  const doneByChapter = new Map<string, number>();
  for (const row of progress) {
    doneByChapter.set(`${row.bookSlug}/${row.chapterId}`, row._count._all);
  }

  const byId = new Map<string, NodeState>();
  const nodes: NodeState[] = [];

  for (const book of books) {
    for (const node of book.roadmap) {
      const found = chapterOf(node.bookSlug, node.chapterId);
      if (!found) continue;
      const done = doneByChapter.get(`${node.bookSlug}/${node.chapterId}`) ?? 0;
      const total = found.chapter.sections.length;
      const state: NodeState = {
        node,
        bookTitle: book.title,
        bookSlug: book.slug,
        tier: book.tier,
        chapterTitle: found.chapter.title,
        done: Math.min(done, total),
        total,
        complete: total > 0 && done >= total,
        lockedBy: [],
      };
      nodes.push(state);
      byId.set(node.id, state);
    }
  }

  // Edges are resolved after every node exists, so a `requires` may point at a later tier
  // without the order in this file mattering.
  for (const state of nodes) {
    state.lockedBy = state.node.requires
      .map((id) => byId.get(id))
      .filter((required): required is NodeState => Boolean(required) && !required!.complete);
  }

  const next =
    nodes.find((state) => !state.complete && state.lockedBy.length === 0) ?? null;

  return { nodes, next, completed: nodes.filter((state) => state.complete).length };
}

/** Only the next node, for the digest and the dashboard card. */
export async function nextNode(userId?: string | null): Promise<NodeState | null> {
  const view = await roadmap(userId);
  return view.next;
}

/** The node a chapter belongs to, for the reader's "where am I" line. */
export function nodeForChapter(bookSlug: string, chapterId: string): RoadmapNode | undefined {
  const book = books.find((candidate) => candidate.slug === bookSlug);
  return book?.roadmap.find((node) => node.chapterId === chapterId);
}
