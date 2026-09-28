import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { addDays, daysBetween, todayInTimezone } from "@/lib/dates";
import { listGoals, listHabits, logsInRange, parseHabitIds } from "@/lib/data";
import { completionRate, currentStreak, indexLogs } from "@/lib/habit-stats";
import { GoalsView, type GoalCard } from "@/components/goals/goals-view";

export const metadata: Metadata = { title: "Goals" };
export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const user = await requireUser();
  const today = todayInTimezone(user.timezone);
  const goals = listGoals(user.id, { includeArchived: true });
  const habits = listHabits(user.id);
  const logs = logsInRange(user.id, addDays(today, -400), today);
  const idx = indexLogs(logs);

  const cards: GoalCard[] = goals.map((g) => {
    const ids = parseHabitIds(g);
    const linked = habits
      .filter((h) => ids.includes(h.id))
      .map((h) => {
        const done = idx.get(h.id) ?? new Set<string>();
        const r = completionRate(h, done, addDays(today, -29), today, user.weekStart);
        return { id: h.id, name: h.name, emoji: h.emoji, color: h.color, rate30: r === null ? null : Math.round(r * 100), streak: currentStreak(h, done, today, user.weekStart) };
      });
    const msDone = g.milestones.filter((m) => m.done).length;
    const msPct = g.milestones.length ? Math.round((msDone / g.milestones.length) * 100) : null;
    const habitPct = linked.length ? Math.round(linked.reduce((a, h) => a + (h.rate30 ?? 0), 0) / linked.length) : null;
    return {
      id: g.id,
      title: g.title,
      description: g.description,
      identity: g.identity,
      color: g.color,
      targetDate: g.targetDate,
      daysLeft: g.targetDate ? daysBetween(today, g.targetDate) : null,
      status: g.status,
      progress: g.progress,
      habitIds: ids,
      milestones: g.milestones.map((m) => ({ id: m.id, title: m.title, done: m.done })),
      linkedHabits: linked,
      milestonePct: msPct,
      habitPct,
    };
  });

  return <GoalsView goals={cards} habits={habits.map((h) => ({ id: h.id, name: h.name, emoji: h.emoji, color: h.color }))} />;
}
