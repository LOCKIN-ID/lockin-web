/**
 * How numbers, money and time are written down, in one place.
 *
 * Two rules hold everywhere in the product. Money is always Indonesian rupiah with no
 * decimals, because the books are priced in round thousands and `Rp49.000` is how a
 * reader in Bandung writes it. Dates and days are always Jakarta wall-clock, computed by
 * shifting the instant by the fixed +7 offset rather than by asking `Intl` for a time
 * zone: the same trick `dayKey` uses, so a label and a streak can never disagree.
 */

import { JAKARTA_OFFSET_MS, dayKey } from "@/lib/gamification/streak";

const IDR = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const COUNT = new Intl.NumberFormat("en-GB");

const DAY = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const DAY_SHORT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

const TIME = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

/** The Jakarta wall-clock instant behind a UTC instant. */
function jakarta(date: Date): Date {
  return new Date(date.getTime() + JAKARTA_OFFSET_MS);
}

/** `Rp49.000`. Zero renders as `Free` only through `priceLabel`, never here. */
export function idr(amountIdr: number): string {
  return IDR.format(Math.round(amountIdr));
}

/** `Rp49.000`, or the word that belongs where a price of nothing is not a price. */
export function priceLabel(amountIdr: number): string {
  return amountIdr === 0 ? "Free" : idr(amountIdr);
}

/** A count with thousands separated, grouped the English way even beside rupiah. */
export function count(n: number): string {
  return COUNT.format(n);
}

/** `1,240 XP`. */
export function xpLabel(xp: number): string {
  return `${COUNT.format(xp)} XP`;
}

/**
 * The reader's own name for themselves: the part before the `@` of the address, or the
 * name they typed. A full address is never shown beside a score, so this is the only
 * function that may turn a user row into a label.
 */
export function displayName(email: string, name?: string | null): string {
  const trimmed = (name ?? "").trim();
  if (trimmed) return trimmed;
  const local = email.split("@")[0] ?? email;
  return local.replace(/[._-]+/g, " ").trim() || "reader";
}

/** `RT`: an avatar fallback, never a username. */
export function initials(value: string): string {
  const words = value.trim().split(/\s+/).slice(0, 2);
  const letters = words.map((word) => word[0]?.toUpperCase() ?? "").join("");
  return letters || "?";
}

/** `25 Oct 2026`, in Jakarta. */
export function dateLong(date: Date): string {
  return DAY.format(jakarta(date));
}

/** `25 Oct`. */
export function dateShort(date: Date): string {
  return DAY_SHORT.format(jakarta(date));
}

/** `25 Oct 2026, 19:04`, in Jakarta. */
export function dateTime(date: Date): string {
  return `${DAY.format(jakarta(date))}, ${TIME.format(jakarta(date))}`;
}

/** `19:04`, in Jakarta. */
export function timeOfDay(date: Date): string {
  return TIME.format(jakarta(date));
}

/** The calendar day of a `dayKey` string, without re-parsing it through a time zone. */
export function dayLabel(key: string): string {
  return DAY.format(new Date(`${key}T00:00:00.000Z`));
}

/** `today`, `yesterday`, `4 days ago`, `in 3 days`, or the date once it is further out. */
export function timeAgo(date: Date, now: Date = new Date()): string {
  const days = Math.round((dayMs(now) - dayMs(date)) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days === -1) return "tomorrow";
  if (days > 1 && days <= 14) return `${days} days ago`;
  if (days < -1 && days >= -14) return `in ${-days} days`;
  return dateLong(date);
}

function dayMs(date: Date): number {
  return Date.parse(`${dayKey(date)}T00:00:00.000Z`);
}

/** `3 days`, `1 day`. */
export function pluralize(n: number, one: string, many = `${one}s`): string {
  return `${count(n)} ${n === 1 ? one : many}`;
}

/** `22 min read`. */
export function readingMinutes(minutes: number): string {
  return `${count(minutes)} min read`;
}

/** `1.4 MB`, `248 KB`. Storage and PDF sizes only. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

/** `10%` from basis points: 1000 -> `10%`, 2550 -> `25.5%`, 250 -> `2.5%`. */
export function percentOffBps(bps: number): string {
  return `${(bps / 100).toFixed(bps % 100 === 0 ? 0 : 1)}%`;
}

/** `1st`, `2nd`, `3rd`, `14th`. */
export function ordinal(n: number): string {
  const rest = n % 100;
  if (rest >= 11 && rest <= 13) return `${n}th`;
  const suffix = ["th", "st", "nd", "rd"][n % 10] ?? "th";
  return `${n}${suffix}`;
}

/** `20–26 Oct 2026` for a Monday-to-Sunday window. */
export function weekRange(startKey: string, endKey: string): string {
  const start = new Date(`${startKey}T00:00:00.000Z`);
  const end = new Date(`${endKey}T00:00:00.000Z`);
  const sameMonth = start.getUTCMonth() === end.getUTCMonth();
  return `${sameMonth ? start.getUTCDate() : dateShort(start)} – ${dateLong(end)}`;
}

/** The six characters a QR quest's printable code has, spaced for reading aloud. */
export function spacedCode(code: string): string {
  return code.split("").join(" ");
}
