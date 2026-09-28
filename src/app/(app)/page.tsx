import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { addDays, formatLong, greetingFor, nowTimeInTimezone, todayInTimezone } from "@/lib/dates";
import { listGoals, listHabits, logsInRange, mindsetInRange, tasksInRange } from "@/lib/data";
import { currentStreak, indexLogs, isScheduled, missedTwice, missedYesterday, periodProgress } from "@/lib/habit-stats";
import { getDailyQuote, principleForDay } from "@/lib/quotes";
import { getWeather, weatherNudge, type WeatherReport } from "@/lib/weather";
import { TodayView, type TodayHabit } from "@/components/today/today-view";

export const metadata: Metadata = { title: "Today" };
export const dynamic = "force-dynamic";

export default async function TodayPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const user = await requireUser();
  const { welcome } = await searchParams;
  const today = todayInTimezone(user.timezone);
  const time = nowTimeInTimezone(user.timezone);

  const habits = listHabits(user.id);
  const logs = logsInRange(user.id, addDays(today, -400), today);
  const idx = indexLogs(logs);

  let weather: WeatherReport | null = null;
  let weatherError: string | null = null;
  if (user.latitude !== null && user.longitude !== null) {
    try {
      weather = await getWeather(user.latitude, user.longitude, user.units, user.timezone);
    } catch (e) {
      weatherError = e instanceof Error ? e.message : "Weather unavailable";
    }
  }

  const todayHabits: TodayHabit[] = habits
    .filter((h) => isScheduled(h, today) || h.frequency !== "daily")
    .map((h) => {
      const done = idx.get(h.id) ?? new Set<string>();
      const progress = periodProgress(h, done, today, user.weekStart);
      return {
        id: h.id,
        name: h.name,
        emoji: h.emoji,
        color: h.color,
        kind: h.kind,
        frequency: h.frequency,
        cueTime: h.cueTime,
        cueLocation: h.cueLocation,
        stackAfter: h.stackAfter,
        twoMinuteVersion: h.twoMinuteVersion,
        identity: h.identity,
        doneToday: done.has(today),
        periodCount: progress.count,
        periodTarget: progress.target,
        streak: currentStreak(h, done, today, user.weekStart),
        missedYesterday: missedYesterday(h, done, today),
        missedTwice: missedTwice(h, done, today),
        nudge: weatherNudge(h.name, weather),
        logNote: logs.find((l) => l.habitId === h.id && l.date === today)?.note ?? null,
      };
    })
    .sort((a, b) => (a.cueTime ?? "99").localeCompare(b.cueTime ?? "99"));

  const tasks = tasksInRange(user.id, today, today);
  const mindset = mindsetInRange(user.id, today, today)[0] ?? null;
  const goals = listGoals(user.id).filter((g) => g.status === "active");
  const [quote] = await Promise.all([getDailyQuote(today)]);
  const principle = principleForDay(today);

  return (
    <TodayView
      user={{ name: user.name, identityStatement: user.identityStatement, hasLocation: user.latitude !== null, locationName: user.locationName, units: user.units }}
      today={today}
      dateLabel={formatLong(today)}
      greeting={greetingFor(time)}
      habits={todayHabits}
      tasks={tasks.map((t) => ({ id: t.id, title: t.title, done: t.done }))}
      mindset={mindset ? { energy: mindset.energy, focus: mindset.focus, motivation: mindset.motivation } : null}
      goals={goals.slice(0, 3).map((g) => ({ id: g.id, title: g.title, progress: g.progress, color: g.color, targetDate: g.targetDate }))}
      weather={weather}
      weatherError={weatherError}
      quote={quote}
      principle={principle}
      welcome={welcome === "1"}
    />
  );
}
