import { withUser } from "@/lib/api";
import { listHabits, logsInRange, tasksInRange } from "@/lib/data";
import { addDays, todayInTimezone } from "@/lib/dates";
import { currentStreak, indexLogs, isScheduled, periodProgress } from "@/lib/habit-stats";

export const dynamic = "force-dynamic";

/** GET /api/v1/today — today's habits with completion state, streaks and tasks. */
export async function GET(req: Request) {
  return withUser(req, (user) => {
    const today = todayInTimezone(user.timezone);
    const habits = listHabits(user.id);
    const idx = indexLogs(logsInRange(user.id, addDays(today, -400), today));
    const items = habits
      .filter((h) => isScheduled(h, today))
      .map((h) => {
        const done = idx.get(h.id) ?? new Set<string>();
        const p = periodProgress(h, done, today, user.weekStart);
        return { id: h.id, name: h.name, emoji: h.emoji, frequency: h.frequency, doneToday: done.has(today), periodCount: p.count, periodTarget: p.target, streak: currentStreak(h, done, today, user.weekStart), cueTime: h.cueTime };
      });
    const tasks = tasksInRange(user.id, today, today).map((t) => ({ id: t.id, title: t.title, done: t.done }));
    const done = items.filter((i) => i.doneToday).length;
    return Response.json({ date: today, timezone: user.timezone, completion: items.length ? Math.round((done / items.length) * 100) : 0, habits: items, tasks });
  });
}
