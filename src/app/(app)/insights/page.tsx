import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { addDays, endOfWeek, startOfWeek, todayInTimezone, weekdayOf } from "@/lib/dates";
import { listGoals, listHabits, logsInRange, tasksInRange } from "@/lib/data";
import { averagePct, bestStreak, completionRate, currentStreak, dailyCompletionSeries, indexLogs, isScheduled } from "@/lib/habit-stats";
import { InsightsView } from "@/components/insights/insights-view";

export const metadata: Metadata = { title: "Insights" };
export const dynamic = "force-dynamic";

const RANGES = { "7": 7, "30": 30, "90": 90, "365": 365 } as const;

export default async function InsightsPage({ searchParams }: { searchParams: Promise<{ h?: string; r?: string; lb?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const today = todayInTimezone(user.timezone);
  const rangeKey = (sp.r && sp.r in RANGES ? sp.r : "7") as keyof typeof RANGES;
  const days = RANGES[rangeKey];
  const from = addDays(today, -(days - 1));
  const lb: "d" | "w" | "m" = sp.lb === "w" || sp.lb === "m" ? sp.lb : "d";

  const habits = listHabits(user.id);
  const selected = sp.h && habits.some((h) => h.id === sp.h) ? sp.h : null;
  const logs = logsInRange(user.id, addDays(from, -400), today);
  const idx = indexLogs(logs);

  const chartHabits = selected ? habits.filter((h) => h.id === selected) : habits;
  const series = dailyCompletionSeries(chartHabits, idx, from, today, user.weekStart);

  // This week vs last week (all habits)
  const ws = startOfWeek(today, user.weekStart);
  const lastWs = addDays(ws, -7);
  const thisWeek = averagePct(dailyCompletionSeries(habits, idx, ws, today, user.weekStart));
  const lastWeek = averagePct(dailyCompletionSeries(habits, idx, lastWs, endOfWeek(lastWs, user.weekStart), user.weekStart));

  // Leaderboard windows
  const lbFrom = lb === "d" ? today : lb === "w" ? ws : `${today.slice(0, 7)}-01`;
  const leaderboard = habits
    .map((h) => {
      const done = idx.get(h.id) ?? new Set<string>();
      const r = completionRate(h, done, lb === "d" ? today : lbFrom, today, user.weekStart);
      return { id: h.id, name: h.name, emoji: h.emoji, color: h.color, pct: r === null ? null : Math.round(r * 100), streak: currentStreak(h, done, today, user.weekStart), best: bestStreak(h, done, today, user.weekStart) };
    })
    .sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1));

  const topStreaks = [...leaderboard].filter((h) => h.streak > 0).sort((a, b) => b.streak - a.streak).slice(0, 5);
  const bestStreakNow = leaderboard.reduce((m, h) => Math.max(m, h.streak), 0);
  const needsAttention = [...leaderboard].filter((h) => h.pct !== null).sort((a, b) => (a.pct ?? 0) - (b.pct ?? 0))[0];

  // Weekday performance (last 90 days, all habits)
  const wd = [0, 1, 2, 3, 4, 5, 6].map(() => ({ done: 0, total: 0 }));
  for (const d of dailyCompletionSeries(habits.filter((h) => h.frequency === "daily"), idx, addDays(today, -89), today, user.weekStart)) {
    if (d.total === 0) continue;
    const i = weekdayOf(d.date);
    wd[i].done += d.done;
    wd[i].total += d.total;
  }
  const weekdayPerf = wd.map((w, i) => ({ weekday: i, pct: w.total ? Math.round((w.done / w.total) * 100) : null }));
  const ordered = [...Array(7)].map((_, i) => weekdayPerf[(user.weekStart + i) % 7]);

  // Totals
  const totalReps = logs.filter((l) => l.date >= from && l.date <= today).length;
  let perfectDays = 0;
  for (const d of dailyCompletionSeries(habits, idx, from, today, user.weekStart)) if (d.total > 0 && d.done === d.total) perfectDays++;

  // Goals & tasks summary
  const goals = listGoals(user.id);
  const gDone = goals.filter((g) => g.status === "completed").length;
  const tasks = tasksInRange(user.id, ws, endOfWeek(ws, user.weekStart));
  const tPct = tasks.length ? Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100) : null;

  // Scheduled today count for hint
  const scheduledToday = habits.filter((h) => isScheduled(h, today)).length;

  return (
    <InsightsView
      today={today}
      range={rangeKey}
      selectedHabit={selected}
      habits={habits.map((h) => ({ id: h.id, name: h.name, emoji: h.emoji }))}
      series={series.map((s) => ({ date: s.date, pct: s.pct }))}
      avg={averagePct(series)}
      thisWeek={thisWeek}
      lastWeek={lastWeek}
      bestStreak={bestStreakNow}
      needsAttention={needsAttention ? { name: needsAttention.name, pct: needsAttention.pct } : null}
      leaderboard={leaderboard}
      lb={lb}
      topStreaks={topStreaks}
      weekdayPerf={ordered}
      totals={{ reps: totalReps, perfectDays, habits: habits.length, scheduledToday }}
      goals={{ done: gDone, total: goals.length }}
      tasksPct={tPct}
    />
  );
}
