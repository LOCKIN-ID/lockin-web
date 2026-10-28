/**
 * Who may open what.
 *
 * Every surface that shows book content: the reader, the PDF route, the quest page and
 * the playground's exercise list: asks this module and nothing else, so there is exactly
 * one definition of "unlocked" in the product. An expired `pro` row is filtered out by
 * `expiresAt`, never deleted: the row is the receipt, and a receipt that vanishes is a
 * support ticket.
 */

import { prisma } from "@/lib/prisma";

export interface Access {
  /** Book slugs the reader owns outright. */
  books: string[];
  /** `all_books`: the whole catalogue, kept. */
  allBooks: boolean;
  /** `pro`: the whole catalogue while the subscription runs. */
  pro: boolean;
}

export const NO_ACCESS: Access = { books: [], allBooks: false, pro: false };

/** A book as much as this gate needs it. `priceIdr === 0` is the deck's acquisition tier. */
export interface GatedBook {
  slug: string;
  priceIdr: number;
}

/**
 * The rule, as a pure function, so it is unit-testable without a database:
 * a free book is open to everyone, and everything else needs an entitlement.
 */
export function canOpen(access: Access, book: GatedBook): boolean {
  if (book.priceIdr <= 0) return true;
  if (access.allBooks || access.pro) return true;
  return access.books.includes(book.slug);
}

/** Every slug the reader can open, for the playground's exercise list. */
export function openSlugs(access: Access, catalogue: GatedBook[]): string[] {
  return catalogue.filter((book) => canOpen(access, book)).map((book) => book.slug);
}

/** The reader's entitlements, as one object. Anonymous readers get `NO_ACCESS`. */
export async function accessFor(userId: string | null | undefined, now: Date = new Date()): Promise<Access> {
  if (!userId) return NO_ACCESS;

  const rows = await prisma.entitlement.findMany({
    where: { userId },
    select: { kind: true, refId: true, expiresAt: true },
  });

  const live = rows.filter((row) => row.expiresAt === null || row.expiresAt > now);

  return {
    books: live.filter((row) => row.kind === "book" && row.refId !== "").map((row) => row.refId),
    allBooks: live.some((row) => row.kind === "all_books"),
    pro: live.some((row) => row.kind === "pro"),
  };
}

export async function hasBook(userId: string, slug: string, now: Date = new Date()): Promise<boolean> {
  const access = await accessFor(userId, now);
  return access.allBooks || access.pro || access.books.includes(slug);
}

export async function hasAllBooks(userId: string, now: Date = new Date()): Promise<boolean> {
  const access = await accessFor(userId, now);
  return access.allBooks;
}

export async function isPro(userId: string, now: Date = new Date()): Promise<boolean> {
  const access = await accessFor(userId, now);
  return access.pro;
}

/** What the gate says when it says no, so the surface can render the right next step. */
export type GateReason = "open" | "free-tier" | "needs-book" | "needs-subscription" | "expired";

export interface Gate {
  open: boolean;
  reason: GateReason;
}

/**
 * The same answer as `canOpen`, with the reason attached: the reader's gate card has to
 * say whether to buy this book, renew a subscription, or nothing at all.
 */
export function gateFor(
  access: Access,
  book: GatedBook,
  entitlements: Array<{ kind: string; refId: string; expiresAt: Date | null }>,
  now: Date = new Date(),
): Gate {
  if (canOpen(access, book)) {
    return { open: true, reason: book.priceIdr <= 0 ? "free-tier" : "open" };
  }
  const lapsed = entitlements.some(
    (row) =>
      row.expiresAt !== null &&
      row.expiresAt <= now &&
      (row.kind === "pro" || (row.kind === "book" && row.refId === book.slug)),
  );
  return { open: false, reason: lapsed ? "expired" : "needs-book" };
}
