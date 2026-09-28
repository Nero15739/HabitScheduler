import { describe, expect, it } from "vitest";
import { bestStreak, completionRate, currentStreak, dailyCompletionSeries, indexLogs, isScheduled, missedTwice, periodProgress } from "@/lib/habit-stats";

const daily = { id: "d", frequency: "daily" as const, daysOfWeek: "[0,1,2,3,4,5,6]", timesPerPeriod: 1, startDate: "2026-09-01", archivedAt: null };
const weekdays = { ...daily, id: "w", daysOfWeek: "[1,2,3,4,5]" };
const weekly = { id: "g", frequency: "weekly" as const, daysOfWeek: "[0,1,2,3,4,5,6]", timesPerPeriod: 3, startDate: "2026-09-01", archivedAt: null };

const set = (...d: string[]) => new Set(d);

describe("isScheduled", () => {
  it("respects start date and weekday mask", () => {
    expect(isScheduled(daily, "2026-08-31")).toBe(false);
    expect(isScheduled(weekdays, "2026-09-26")).toBe(false); // Saturday
    expect(isScheduled(weekdays, "2026-09-28")).toBe(true); // Monday
  });
});

describe("currentStreak (daily)", () => {
  it("counts consecutive days ending today", () => {
    expect(currentStreak(daily, set("2026-09-26", "2026-09-27", "2026-09-28"), "2026-09-28", 1)).toBe(3);
  });
  it("doesn't break when today is still open", () => {
    expect(currentStreak(daily, set("2026-09-26", "2026-09-27"), "2026-09-28", 1)).toBe(2);
  });
  it("breaks on a missed scheduled day", () => {
    expect(currentStreak(daily, set("2026-09-25", "2026-09-27"), "2026-09-28", 1)).toBe(1);
  });
  it("skips unscheduled days", () => {
    // Fri 25, (Sat/Sun off), Mon 28
    expect(currentStreak(weekdays, set("2026-09-24", "2026-09-25", "2026-09-28"), "2026-09-28", 1)).toBe(3);
  });
});

describe("weekly habits", () => {
  it("tracks period progress and streaks by week", () => {
    const done = set("2026-09-21", "2026-09-22", "2026-09-24", "2026-09-28");
    expect(periodProgress(weekly, done, "2026-09-28", 1)).toMatchObject({ count: 1, target: 3, from: "2026-09-28", to: "2026-10-04" });
    // Last week hit the target, this week not yet: streak 1 (current week doesn't break it)
    expect(currentStreak(weekly, done, "2026-09-28", 1)).toBe(1);
    expect(bestStreak(weekly, done, "2026-09-28", 1)).toBe(1);
  });
  it("computes completion rate averaged per week", () => {
    const done = set("2026-09-21", "2026-09-22", "2026-09-24");
    // Week of 21st fully done, week of 28th nothing -> 50%
    expect(completionRate(weekly, done, "2026-09-21", "2026-10-04", 1)).toBeCloseTo(0.5);
  });
});

describe("completion series & never miss twice", () => {
  it("builds a per-day percentage", () => {
    const idx = indexLogs([
      { habitId: "d", date: "2026-09-27", status: "done" },
      { habitId: "w", date: "2026-09-28", status: "done" },
    ]);
    const s = dailyCompletionSeries([daily, weekdays], idx, "2026-09-26", "2026-09-28", 1);
    expect(s.map((x) => x.pct)).toEqual([0, 100, 50]); // Sat: only daily scheduled; Sun: daily done; Mon: 1 of 2
  });
  it("flags two consecutive misses", () => {
    expect(missedTwice(daily, set("2026-09-25"), "2026-09-28")).toBe(true);
    expect(missedTwice(daily, set("2026-09-27"), "2026-09-28")).toBe(false);
  });
});
