import type { Habit, HabitLog } from "@/db/schema";
import {
  addDays,
  addMonths,
  eachDay,
  eachMonth,
  eachWeek,
  endOfMonth,
  endOfWeek,
  monthKey,
  startOfMonth,
  startOfWeek,
  weekdayOf,
  type ISODate,
} from "./dates";

export type HabitLike = Pick<
  Habit,
  "id" | "frequency" | "daysOfWeek" | "timesPerPeriod" | "startDate" | "archivedAt"
>;

export function parseDays(habit: HabitLike): number[] {
  try {
    const arr = JSON.parse(habit.daysOfWeek);
    if (Array.isArray(arr)) return arr.filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
  } catch {
    /* ignore */
  }
  return [0, 1, 2, 3, 4, 5, 6];
}

/** Whether a daily habit is expected on the given day. Weekly/monthly habits are "available" every day. */
export function isScheduled(habit: HabitLike, date: ISODate): boolean {
  if (date < habit.startDate) return false;
  if (habit.archivedAt && date > habit.archivedAt.slice(0, 10)) return false;
  if (habit.frequency !== "daily") return true;
  return parseDays(habit).includes(weekdayOf(date));
}

export type LogIndex = Map<string, Set<ISODate>>; // habitId -> done dates

export function indexLogs(logs: Pick<HabitLog, "habitId" | "date" | "status">[]): LogIndex {
  const idx: LogIndex = new Map();
  for (const l of logs) {
    if (l.status !== "done") continue;
    let set = idx.get(l.habitId);
    if (!set) {
      set = new Set();
      idx.set(l.habitId, set);
    }
    set.add(l.date);
  }
  return idx;
}

function countInRange(done: Set<ISODate>, from: ISODate, to: ISODate): number {
  let n = 0;
  for (const d of done) if (d >= from && d <= to) n++;
  return n;
}

export function periodProgress(
  habit: HabitLike,
  done: Set<ISODate>,
  date: ISODate,
  weekStart: number,
): { count: number; target: number; from: ISODate; to: ISODate } {
  if (habit.frequency === "weekly") {
    const from = startOfWeek(date, weekStart);
    const to = endOfWeek(date, weekStart);
    return { count: countInRange(done, from, to), target: Math.max(1, habit.timesPerPeriod), from, to };
  }
  if (habit.frequency === "monthly") {
    const from = startOfMonth(date);
    const to = endOfMonth(date);
    return { count: countInRange(done, from, to), target: Math.max(1, habit.timesPerPeriod), from, to };
  }
  return { count: done.has(date) ? 1 : 0, target: 1, from: date, to: date };
}

/** Completion ratio for a habit over an inclusive date range (0..1), or null if nothing was scheduled. */
export function completionRate(
  habit: HabitLike,
  done: Set<ISODate>,
  from: ISODate,
  to: ISODate,
  weekStart: number,
): number | null {
  if (habit.frequency === "daily") {
    let scheduled = 0;
    let hit = 0;
    for (const d of eachDay(from, to)) {
      if (!isScheduled(habit, d)) continue;
      scheduled++;
      if (done.has(d)) hit++;
    }
    return scheduled ? hit / scheduled : null;
  }
  const target = Math.max(1, habit.timesPerPeriod);
  const buckets =
    habit.frequency === "weekly"
      ? eachWeek(from, to, weekStart).map((s) => [s, endOfWeek(s, weekStart)] as const)
      : eachMonth(from, to).map((s) => [s, endOfMonth(s)] as const);
  let sum = 0;
  let n = 0;
  for (const [s, e] of buckets) {
    if (e < habit.startDate) continue;
    n++;
    sum += Math.min(1, countInRange(done, s, e) / target);
  }
  return n ? sum / n : null;
}

/**
 * Current streak in periods (days for daily habits, weeks/months otherwise).
 * The current period does not break the streak when it's still open and incomplete.
 */
export function currentStreak(habit: HabitLike, done: Set<ISODate>, today: ISODate, weekStart: number): number {
  if (habit.frequency === "daily") {
    let streak = 0;
    let cur = today;
    // Today counts if done; if not, start from yesterday.
    if (isScheduled(habit, cur) && !done.has(cur)) cur = addDays(cur, -1);
    let guard = 0;
    while (cur >= habit.startDate && guard++ < 5000) {
      if (isScheduled(habit, cur)) {
        if (done.has(cur)) streak++;
        else break;
      }
      cur = addDays(cur, -1);
    }
    return streak;
  }
  const target = Math.max(1, habit.timesPerPeriod);
  const step = (d: ISODate) => (habit.frequency === "weekly" ? addDays(d, -7) : addMonths(d, -1));
  const bounds = (d: ISODate) =>
    habit.frequency === "weekly"
      ? ([startOfWeek(d, weekStart), endOfWeek(d, weekStart)] as const)
      : ([startOfMonth(d), endOfMonth(d)] as const);
  let cur = today;
  let streak = 0;
  let [s, e] = bounds(cur);
  if (countInRange(done, s, e) < target) {
    cur = step(s);
  }
  let guard = 0;
  while (guard++ < 600) {
    [s, e] = bounds(cur);
    if (e < habit.startDate) break;
    if (countInRange(done, s, e) >= target) streak++;
    else break;
    cur = step(s);
  }
  return streak;
}

export function bestStreak(habit: HabitLike, done: Set<ISODate>, today: ISODate, weekStart: number): number {
  let best = 0;
  let run = 0;
  if (habit.frequency === "daily") {
    for (const d of eachDay(habit.startDate, today)) {
      if (!isScheduled(habit, d)) continue;
      if (done.has(d)) {
        run++;
        best = Math.max(best, run);
      } else run = 0;
    }
    return best;
  }
  const target = Math.max(1, habit.timesPerPeriod);
  const buckets =
    habit.frequency === "weekly"
      ? eachWeek(habit.startDate, today, weekStart).map((s) => [s, endOfWeek(s, weekStart)] as const)
      : eachMonth(habit.startDate, today).map((s) => [s, endOfMonth(s)] as const);
  for (const [s, e] of buckets) {
    if (countInRange(done, s, e) >= target) {
      run++;
      best = Math.max(best, run);
    } else if (e < today) run = 0;
  }
  return best;
}

/** Percentage of scheduled habits completed for each day in the range. */
export function dailyCompletionSeries(
  habits: HabitLike[],
  idx: LogIndex,
  from: ISODate,
  to: ISODate,
  weekStart: number,
): { date: ISODate; pct: number | null; done: number; total: number }[] {
  return eachDay(from, to).map((date) => {
    let total = 0;
    let done = 0;
    for (const h of habits) {
      if (h.frequency === "daily") {
        if (!isScheduled(h, date)) continue;
        total++;
        if (idx.get(h.id)?.has(date)) done++;
      } else {
        // For periodic habits, count the day as "done" if the period target was hit by that day.
        if (date < h.startDate) continue;
        const set = idx.get(h.id) ?? new Set<ISODate>();
        const p = periodProgress(h, set, date, weekStart);
        // Only count periodic habits on the last day of their period so they don't drown daily ones.
        if (date !== p.to && date !== to) continue;
        total++;
        if (countInRange(set, p.from, date) >= p.target) done++;
      }
    }
    return { date, pct: total ? Math.round((done / total) * 100) : null, done, total };
  });
}

export function averagePct(series: { pct: number | null }[]): number | null {
  const vals = series.map((s) => s.pct).filter((v): v is number => v !== null);
  if (!vals.length) return null;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

export function missedYesterday(habit: HabitLike, done: Set<ISODate>, today: ISODate): boolean {
  if (habit.frequency !== "daily") return false;
  const y = addDays(today, -1);
  return isScheduled(habit, y) && !done.has(y);
}

export function missedTwice(habit: HabitLike, done: Set<ISODate>, today: ISODate): boolean {
  if (habit.frequency !== "daily") return false;
  let misses = 0;
  let cur = addDays(today, -1);
  let guard = 0;
  while (misses < 2 && guard++ < 14 && cur >= habit.startDate) {
    if (isScheduled(habit, cur)) {
      if (done.has(cur)) return false;
      misses++;
    }
    cur = addDays(cur, -1);
  }
  return misses >= 2;
}

export function monthGridWeeks(month: ISODate, weekStart: number): ISODate[] {
  const first = startOfMonth(month);
  const last = endOfMonth(month);
  return eachWeek(first, last, weekStart);
}

export { monthKey };
