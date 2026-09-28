import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { addDays, todayInTimezone } from "@/lib/dates";
import { getHabit, logsInRange } from "@/lib/data";
import { bestStreak, completionRate, currentStreak, indexLogs } from "@/lib/habit-stats";
import { HabitDetail } from "@/components/habits/habit-detail";

export const metadata: Metadata = { title: "Habit" };
export const dynamic = "force-dynamic";

export default async function HabitPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const habit = getHabit(user.id, id);
  if (!habit) notFound();
  const today = todayInTimezone(user.timezone);
  const from = addDays(today, -364);
  const logs = logsInRange(user.id, addDays(from, -400), today, [habit.id]);
  const idx = indexLogs(logs);
  const done = idx.get(habit.id) ?? new Set<string>();
  const r30 = completionRate(habit, done, addDays(today, -29), today, user.weekStart);
  const rAll = completionRate(habit, done, habit.startDate, today, user.weekStart);
  return (
    <HabitDetail
      habit={{
        id: habit.id,
        name: habit.name,
        emoji: habit.emoji,
        color: habit.color,
        kind: habit.kind,
        frequency: habit.frequency,
        daysOfWeek: JSON.parse(habit.daysOfWeek) as number[],
        timesPerPeriod: habit.timesPerPeriod,
        identity: habit.identity,
        cueTime: habit.cueTime,
        cueLocation: habit.cueLocation,
        stackAfter: habit.stackAfter,
        twoMinuteVersion: habit.twoMinuteVersion,
        reward: habit.reward,
        notes: habit.notes,
        startDate: habit.startDate,
        archived: !!habit.archivedAt,
      }}
      today={today}
      weekStart={user.weekStart}
      doneDates={[...done]}
      notes={logs.filter((l) => l.note).map((l) => ({ date: l.date, note: l.note! })).sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 20)}
      stats={{
        rate30: r30 === null ? null : Math.round(r30 * 100),
        rateAll: rAll === null ? null : Math.round(rAll * 100),
        streak: currentStreak(habit, done, today, user.weekStart),
        best: bestStreak(habit, done, today, user.weekStart),
        total: done.size,
      }}
    />
  );
}
