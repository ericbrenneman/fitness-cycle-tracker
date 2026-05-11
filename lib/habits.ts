// ============================================================
// APEX HABITS — shared helpers for hydration and conscious
// consumption tracking. No cycle logic touched here.
// ============================================================

/**
 * Get today's date as a YYYY-MM-DD string in local time.
 * Avoids UTC timezone bugs.
 */
export function todayLocalISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Get the Monday of the current week as a YYYY-MM-DD string.
 * Week runs Monday–Sunday.
 */
export function currentWeekStart(): string {
  const d = new Date();
  const day = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day2 = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day2}`;
}

/**
 * Get the Monday of the PREVIOUS week as a YYYY-MM-DD string.
 */
export function previousWeekStart(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff - 7);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day2 = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day2}`;
}

/**
 * Get the Sunday of a week given its Monday date string.
 */
export function weekEnd(weekStartISO: string): string {
  const [y, m, d] = weekStartISO.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + 6);
  const yr = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const dy = String(date.getDate()).padStart(2, "0");
  return `${yr}-${mo}-${dy}`;
}

/**
 * Subtract N days from a YYYY-MM-DD string and return new string.
 */
export function subtractDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - days);
  const yr = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const dy = String(date.getDate()).padStart(2, "0");
  return `${yr}-${mo}-${dy}`;
}

/**
 * Calculate hydration streak.
 * Streak = consecutive days (ending yesterday or earlier) where
 * amount_oz >= goal. Today is excluded from breaking the streak
 * until tomorrow — standard app behavior.
 *
 * @param logs - array of { logged_at: string, amount_oz: number }
 * @param goalOz - daily hydration goal
 */
export function calcHydrationStreak(
  logs: { logged_at: string; amount_oz: number }[],
  goalOz: number
): number {
  if (logs.length === 0) return 0;

  const today = todayLocalISO();

  // Build a map of date → amount
  const byDate = new Map<string, number>();
  for (const log of logs) {
    byDate.set(log.logged_at, log.amount_oz);
  }

  // Walk backwards from yesterday
  let streak = 0;
  let check = subtractDays(today, 1);

  for (let i = 0; i < 365; i++) {
    const amount = byDate.get(check) ?? 0;
    if (amount >= goalOz) {
      streak++;
      check = subtractDays(check, 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calculate conscious consumption streak.
 * Streak = consecutive COMPLETED weeks (Mon–Sun, ending before
 * current week) where drink_count <= limit.
 * Current week is never counted toward streak — only completed weeks.
 *
 * @param logs - array of { week_start: string, drink_count: number }
 * @param limit - weekly drink limit
 */
export function calcAlcoholStreak(
  logs: { week_start: string; drink_count: number }[],
  limit: number
): number {
  if (logs.length === 0) return 0;

  const thisWeek = currentWeekStart();

  // Build map of week_start → drink_count
  const byWeek = new Map<string, number>();
  for (const log of logs) {
    byWeek.set(log.week_start, log.drink_count);
  }

  // Walk backwards from last completed week
  let streak = 0;
  let check = previousWeekStart();

  for (let i = 0; i < 52; i++) {
    if (check >= thisWeek) break; // safety guard
    const count = byWeek.get(check) ?? 0;
    if (count <= limit) {
      streak++;
      // Go back one more week
      check = subtractDays(check, 7);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Check if today's hydration goal has been met.
 */
export function hydrationGoalMet(
  todayOz: number,
  goalOz: number
): boolean {
  return todayOz >= goalOz;
}

/**
 * Check if the current week's conscious consumption goal is met.
 * Only valid for the current week in progress.
 */
export function alcoholGoalMet(
  thisWeekCount: number,
  limit: number
): boolean {
  return thisWeekCount <= limit;
}