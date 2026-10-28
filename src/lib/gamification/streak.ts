/**
 * Days, honestly, in Asia/Jakarta.
 *
 * The whole product counts practice in days: the streak, the XP chart, the leaderboard
 * week, the once-a-day e-mails. Jakarta is a fixed UTC+7 with no daylight saving, so a
 * constant offset is exact: no timezone database, no `Intl` in a hot path, and the same
 * answer on a laptop in Bandung and a server in Frankfurt.
 */

export const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;

/** The Jakarta calendar day of an instant, as "YYYY-MM-DD". */
export function dayKey(date: Date): string {
  return new Date(date.getTime() + JAKARTA_OFFSET_MS).toISOString().slice(0, 10);
}

/** Midnight in Jakarta, as an instant: the start of the day `key` names. */
export function dayKeyStart(key: string): Date {
  return new Date(Date.parse(`${key}T00:00:00.000Z`) - JAKARTA_OFFSET_MS);
}

/** The day before `key`. */
export function previousDayKey(key: string): string {
  return dayKey(new Date(dayKeyStart(key).getTime() - 1));
}

/** The Monday that opens the week containing `key` (Jakarta days, Monday-first). */
export function weekStartKey(key: string): string {
  const start = dayKeyStart(key);
  const weekday = (start.getUTCDay() + 6) % 7; // 0 = Monday in Jakarta
  return previousDayKey(dayKey(new Date(start.getTime() + JAKARTA_OFFSET_MS))).replace(
    /$^/,
    "",
  ) === ""
    ? key
    : addDays(key, -weekday);
}

/** `key` shifted by `days`. */
export function addDays(key: string, days: number): string {
  return dayKey(new Date(dayKeyStart(key).getTime() + days * 24 * 60 * 60 * 1000));
}

export interface StreakState {
  streakCurrent: number;
  streakBest: number;
  lastStreakDay: string | null;
  daysActive: number;
}

export interface StreakOutcome extends StreakState {
  /** false when today was already counted: the caller must not award XP twice. */
  isNewDay: boolean;
}

/**
 * Fold one day's first qualifying action into the streak. Weekends count like any other
 * day; a missed day resets the count to 1 but keeps the best.
 */
export function streakAfter(state: StreakState, key: string): StreakOutcome {
  if (state.lastStreakDay === key) return { ...state, isNewDay: false };

  const continued = state.lastStreakDay !== null && state.lastStreakDay === previousDayKey(key);
  const streakCurrent = continued ? state.streakCurrent + 1 : 1;

  return {
    streakCurrent,
    streakBest: Math.max(state.streakBest, streakCurrent),
    lastStreakDay: key,
    daysActive: state.daysActive + 1,
    isNewDay: true,
  };
}

/** Streak XP: 10 a day, plus 5 once the streak reaches a week, plus 10 at thirty days. */
export function streakXp(streakCurrent: number): number {
  return 10 + (streakCurrent >= 7 ? 5 : 0) + (streakCurrent >= 30 ? 10 : 0);
}
