import { driverIsD1 } from "./prisma";

/**
 * Runs writes one at a time, in order, and returns their results.
 *
 * Every money or XP path is written as an ordered sequence of single-row writes that
 * each tolerate being run twice, so the same code is correct on all three drivers:
 * SQLite and libSQL would accept `prisma.$transaction` here, and D1 ignores it.
 * `$transaction` is therefore reserved for the two places that genuinely need
 * all-or-nothing (order creation and badge awards), and both start with `driverIsD1()`.
 */
export async function runSerial<T>(ops: Array<() => Promise<T>>): Promise<T[]> {
  const results: T[] = [];
  for (const op of ops) results.push(await op());
  return results;
}
