import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { addDays, endOfMonth, endOfWeek, isValidISODate, startOfMonth, todayInTimezone } from "@/lib/dates";
import { listHabits, logsInRange } from "@/lib/data";
import { averagePct, bestStreak, completionRate, currentStreak, dailyCompletionSeries, indexLogs, monthGridWeeks } from "@/lib/habit-stats";
import { HabitsView, type HabitRow } from "@/components/habits/habits-view";

export const metadata: Metadata = { title: "Habits" };
export const dynamic = "force-dynamic";

type View = "daily" | "weekly" | "monthly";

export default async function HabitsPage({ searchParams }: { searchParams: Promise<{ m?: string; v?: string; new?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const today = todayInTimezone(user.timezone);
  const view: View = sp.v === "weekly" || sp.v === "monthly" ? sp.v : "daily";
  const month = sp.m && /^\d{4}-\d{2}$/.test(sp.m) && isValidISODate(`${sp.m}-01`) ? `${sp.m}-01` : startOfMonth(today);

  const habits = listHabits(user.id);
  const visible = habits.filter((h) => h.frequency === view);

  // Range shown in the grid
  let from: string;
  let to: string;
  if (view === "monthly") {
    from = `${month.slice(0, 4)}-01-01`;
    to = `${month.slice(0, 4)}-12-31`;
  } else if (view === "weekly") {
    const weeks = monthGridWeeks(month, user.weekStart);
    from = weeks[0];
    to = endOfWeek(weeks[weeks.length - 1], user.weekStart);
  } else {
    from = startOfMonth(month);
    to = endOfMonth(month);
  }

  // Pull a wide window so streaks are correct.
  const logs = logsInRange(user.id, addDays(from, -400), today > to ? today : to);
  const idx = indexLogs(logs);
  const rangeEnd = to < today ? to : today;

  const rows: HabitRow[] = visible.map((h) => {
    const done = idx.get(h.id) ?? new Set<string>();
    const rate = completionRate(h, done, from, rangeEnd, user.weekStart);
    return {
      id: h.id,
      name: h.name,
      emoji: h.emoji,
      color: h.color,
      kind: h.kind,
      frequency: h.frequency,
      daysOfWeek: JSON.parse(h.daysOfWeek) as number[],
      timesPerPeriod: h.timesPerPeriod,
      startDate: h.startDate,
      doneDates: [...done].filter((d) => d >= from && d <= to),
      pct: rate === null ? null : Math.round(rate * 100),
      streak: currentStreak(h, done, today, user.weekStart),
      best: bestStreak(h, done, today, user.weekStart),
    };
  });

  // Trend across the visible month (all daily habits), plus today's done count
  const dailyHabits = habits.filter((h) => h.frequency === "daily");
  const series = dailyCompletionSeries(dailyHabits, idx, startOfMonth(month), endOfMonth(month) < today ? endOfMonth(month) : today, user.weekStart);
  const todayRow = dailyCompletionSeries(dailyHabits, idx, today, today, user.weekStart)[0];

  return (
    <HabitsView
      view={view}
      month={month}
      today={today}
      weekStart={user.weekStart}
      rows={rows}
      allHabits={habits.map((h) => ({ id: h.id, name: h.name, emoji: h.emoji, color: h.color, kind: h.kind, frequency: h.frequency, daysOfWeek: JSON.parse(h.daysOfWeek) as number[], timesPerPeriod: h.timesPerPeriod, identity: h.identity, cueTime: h.cueTime, cueLocation: h.cueLocation, stackAfter: h.stackAfter, twoMinuteVersion: h.twoMinuteVersion, reward: h.reward, notes: h.notes, startDate: h.startDate }))}
      trend={series.map((s) => ({ date: s.date, pct: s.pct }))}
      avg={averagePct(series)}
      todayDone={todayRow?.done ?? 0}
      todayTotal={todayRow?.total ?? 0}
      openNew={sp.new === "1"}
    />
  );
}
