import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { addDays, endOfWeek, isValidISODate, startOfWeek, todayInTimezone } from "@/lib/dates";
import { mindsetInRange, tasksInRange } from "@/lib/data";
import { TasksView } from "@/components/tasks/tasks-view";

export const metadata: Metadata = { title: "Tasks" };
export const dynamic = "force-dynamic";

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ w?: string }> }) {
  const user = await requireUser();
  const { w } = await searchParams;
  const today = todayInTimezone(user.timezone);
  const anchor = w && isValidISODate(w) ? w : today;
  const from = startOfWeek(anchor, user.weekStart);
  const to = endOfWeek(anchor, user.weekStart);
  const tasks = tasksInRange(user.id, from, to);
  const mindset = mindsetInRange(user.id, from, to);
  const days = [...Array(7)].map((_, i) => addDays(from, i));
  return (
    <TasksView
      today={today}
      from={from}
      to={to}
      days={days}
      tasks={tasks.map((t) => ({ id: t.id, title: t.title, date: t.date, done: t.done }))}
      mindset={mindset.map((m) => ({ date: m.date, energy: m.energy, focus: m.focus, motivation: m.motivation }))}
    />
  );
}
