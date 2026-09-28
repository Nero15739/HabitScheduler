"use client";

import Link from "next/link";
import { useMemo, useOptimistic, useState, useTransition } from "react";
import { ArrowRight, Check, Flame, MapPin, Plus, Sparkles, Trash2 } from "lucide-react";
import { setHabitLog } from "@/app/actions/habits";
import { addTask, deleteTask, saveMindset, toggleTask } from "@/app/actions/tasks";
import { Bar, Button, Card, Label, Ring, cn } from "@/components/ui";
import { colorVar } from "@/lib/colors";
import { formatTime12 } from "@/lib/dates";
import type { Principle, Quote } from "@/lib/quotes";
import type { WeatherReport } from "@/lib/weather-shared";
import { WeatherCard } from "./weather-card";
import { MindsetSliders } from "@/components/mindset-sliders";

export type TodayHabit = {
  id: string;
  name: string;
  emoji: string | null;
  color: string;
  kind: "build" | "break";
  frequency: "daily" | "weekly" | "monthly";
  cueTime: string | null;
  cueLocation: string | null;
  stackAfter: string | null;
  twoMinuteVersion: string | null;
  identity: string | null;
  doneToday: boolean;
  periodCount: number;
  periodTarget: number;
  streak: number;
  missedYesterday: boolean;
  missedTwice: boolean;
  nudge: string | null;
  logNote: string | null;
};

type Props = {
  user: { name: string; identityStatement: string | null; hasLocation: boolean; locationName: string | null; units: "metric" | "imperial" };
  today: string;
  dateLabel: string;
  greeting: string;
  habits: TodayHabit[];
  tasks: { id: string; title: string; done: boolean }[];
  mindset: { energy: number | null; focus: number | null; motivation: number | null } | null;
  goals: { id: string; title: string; progress: number; color: string; targetDate: string | null }[];
  weather: WeatherReport | null;
  weatherError: string | null;
  quote: Quote;
  principle: Principle;
  welcome: boolean;
};

export function TodayView(p: Props) {
  const [habits, setHabits] = useOptimistic(p.habits);
  const [, startTransition] = useTransition();
  const done = habits.filter((h) => h.doneToday).length;
  const pct = habits.length ? Math.round((done / habits.length) * 100) : 0;
  const bestStreak = habits.reduce((m, h) => Math.max(m, h.streak), 0);
  const needsAttention = habits.filter((h) => h.missedTwice);

  function toggle(h: TodayHabit) {
    const next = !h.doneToday;
    startTransition(async () => {
      setHabits((prev) => prev.map((x) => (x.id === h.id ? { ...x, doneToday: next, periodCount: x.periodCount + (next ? 1 : -1), streak: Math.max(0, x.streak + (next ? 1 : -1)) } : x)));
      await setHabitLog(h.id, p.today, next);
    });
  }

  return (
    <div className="space-y-5 animate-fade-up">
      {p.welcome && (
        <Card className="border-accent/40 bg-accent-soft">
          <div className="flex items-start gap-3">
            <Sparkles className="text-accent shrink-0 mt-0.5" size={20} />
            <div>
              <div className="font-bold">Welcome to HabitScheduler</div>
              <p className="text-sm text-text-2 mt-1">
                Start with one or two habits, make them obvious with a time and place, and check them off as soon as they&apos;re done.{" "}
                <Link href="/habits?new=1" className="text-accent font-semibold">Create your first habit →</Link>
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <Label>{p.dateLabel}</Label>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            {p.greeting}, {p.user.name.split(" ")[0]}
          </h2>
          {p.user.identityStatement ? (
            <p className="text-sm text-text-2 mt-1">“{p.user.identityStatement}”</p>
          ) : (
            <p className="text-sm text-text-3 mt-1">
              Every action is a vote for the person you want to become.{" "}
              <Link href="/settings#identity" className="text-accent">Write your identity statement</Link>
            </p>
          )}
        </div>
      </div>

      {/* Top row: progress + stats + weather */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex items-center gap-5 md:col-span-1">
          <Ring value={pct} size={104} stroke={9}>
            <div className="text-center">
              <div className="text-2xl font-extrabold tabular">{pct}%</div>
            </div>
          </Ring>
          <div className="flex-1 space-y-2">
            <Label>Today</Label>
            <div className="text-lg font-bold">
              {done}/{habits.length} habits done
            </div>
            <div className="flex items-center gap-4 text-sm text-text-2">
              <span className="inline-flex items-center gap-1"><Flame size={15} className="text-warning" /> Best streak {bestStreak}</span>
            </div>
            {needsAttention.length > 0 && (
              <div className="text-xs text-danger font-semibold">
                Never miss twice: {needsAttention.map((h) => h.name).join(", ")}
              </div>
            )}
          </div>
        </Card>
        <div className="md:col-span-2">
          <WeatherCard weather={p.weather} error={p.weatherError} hasLocation={p.user.hasLocation} locationName={p.user.locationName} today={p.today} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Habit checklist */}
        <Card className="lg:col-span-2 p-0 overflow-hidden lg:self-start">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <Label>Today&apos;s habits</Label>
            <Link href="/habits" className="text-xs font-bold text-accent inline-flex items-center gap-1">
              Open <ArrowRight size={14} />
            </Link>
          </div>
          {habits.length === 0 ? (
            <div className="px-5 pb-6 text-sm text-text-2">
              No habits yet.{" "}
              <Link href="/habits?new=1" className="text-accent font-semibold">Add one</Link> and it will show up here.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {habits.map((h) => (
                <li key={h.id} className={cn("flex items-start gap-3 px-4 sm:px-5 py-3.5 transition", h.doneToday && "bg-accent-soft/40")}>
                  <button
                    onClick={() => toggle(h)}
                    aria-pressed={h.doneToday}
                    aria-label={`${h.doneToday ? "Undo" : "Complete"} ${h.name}`}
                    className={cn(
                      "mt-0.5 h-9 w-9 shrink-0 rounded-full border-2 inline-flex items-center justify-center transition",
                      h.doneToday ? "animate-pop" : "border-border-strong hover:border-accent",
                    )}
                    style={h.doneToday ? { background: colorVar(h.color), borderColor: colorVar(h.color), color: "#06201b" } : undefined}
                  >
                    {h.doneToday && <Check size={18} strokeWidth={3} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/habits/${h.id}`} className={cn("font-semibold truncate hover:underline", h.doneToday && "text-text-2 line-through decoration-2")}>
                        {h.emoji && <span className="mr-1.5">{h.emoji}</span>}
                        {h.name}
                      </Link>
                      {h.kind === "break" && <span className="text-[10px] font-bold tracking-widest uppercase text-text-3 border border-border rounded-full px-2 py-0.5">Avoid</span>}
                      {h.frequency !== "daily" && (
                        <span className="text-[11px] text-text-3 tabular">
                          {h.periodCount}/{h.periodTarget} this {h.frequency === "weekly" ? "week" : "month"}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-text-3 flex flex-wrap gap-x-3 gap-y-0.5">
                      {h.cueTime && <span>{formatTime12(h.cueTime)}</span>}
                      {h.cueLocation && <span className="inline-flex items-center gap-1"><MapPin size={11} />{h.cueLocation}</span>}
                      {h.stackAfter && <span>after {h.stackAfter}</span>}
                      {h.streak > 0 && <span className="inline-flex items-center gap-0.5 text-warning font-semibold"><Flame size={11} />{h.streak}</span>}
                    </div>
                    {!h.doneToday && h.missedYesterday && h.twoMinuteVersion && (
                      <div className="mt-1 text-xs text-accent">Missed yesterday. Two-minute version: {h.twoMinuteVersion}</div>
                    )}
                    {!h.doneToday && h.missedYesterday && !h.twoMinuteVersion && (
                      <div className="mt-1 text-xs text-accent">Missed yesterday. Never miss twice.</div>
                    )}
                    {h.nudge && <div className="mt-1 text-xs text-text-2">{h.nudge}</div>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Right column */}
        <div className="space-y-4">
          <PrincipleCard principle={p.principle} quote={p.quote} />
          <TodayTasks today={p.today} tasks={p.tasks} />
          <MindsetCard today={p.today} mindset={p.mindset} />
          {p.goals.length > 0 && (
            <Card>
              <div className="flex items-center justify-between mb-3">
                <Label>Goals</Label>
                <Link href="/goals" className="text-xs font-bold text-accent inline-flex items-center gap-1">Open <ArrowRight size={14} /></Link>
              </div>
              <ul className="space-y-3">
                {p.goals.map((g) => (
                  <li key={g.id}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-semibold truncate">{g.title}</span>
                      <span className="tabular text-text-2">{g.progress}%</span>
                    </div>
                    <Bar value={g.progress} color={colorVar(g.color)} />
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function PrincipleCard({ principle, quote }: { principle: Principle; quote: Quote }) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/10 blur-2xl" aria-hidden />
      <Label className="text-accent">{principle.law}</Label>
      <div className="text-lg font-extrabold tracking-tight mt-1">{principle.title}</div>
      <p className="text-sm text-text-2 mt-1.5">{principle.body}</p>
      <div className="mt-3 rounded-2xl bg-surface-2 border border-border px-3.5 py-2.5 text-sm">
        <span className="label mr-2">Try today</span>
        {principle.action}
      </div>
      <blockquote className="mt-4 border-l-2 border-accent pl-3 text-sm italic text-text-2">
        “{quote.text}”
        <footer className="not-italic text-xs text-text-3 mt-1">
          — {quote.author}
          {quote.source === "zenquotes" && (
            <>
              {" · "}
              <a href="https://zenquotes.io/" target="_blank" rel="noreferrer" className="hover:underline">ZenQuotes</a>
            </>
          )}
        </footer>
      </blockquote>
    </Card>
  );
}

function TodayTasks({ today, tasks }: { today: string; tasks: { id: string; title: string; done: boolean }[] }) {
  const [items, setItems] = useOptimistic(tasks);
  const [, start] = useTransition();
  const [text, setText] = useState("");
  const doneCount = useMemo(() => items.filter((t) => t.done).length, [items]);
  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <Label>Tasks today</Label>
        <span className="text-xs text-text-3 tabular">{doneCount}/{items.length}</span>
      </div>
      <ul className="space-y-1.5">
        {items.map((t) => (
          <li key={t.id} className="group flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-surface-2">
            <button
              aria-label={t.done ? "Mark not done" : "Mark done"}
              onClick={() =>
                start(async () => {
                  setItems((prev) => prev.map((x) => (x.id === t.id ? { ...x, done: !t.done } : x)));
                  await toggleTask(t.id, !t.done);
                })
              }
              className={cn("h-6 w-6 rounded-md border-2 inline-flex items-center justify-center transition shrink-0", t.done ? "bg-accent border-accent text-accent-fg" : "border-border-strong hover:border-accent")}
            >
              {t.done && <Check size={14} strokeWidth={3} />}
            </button>
            <span className={cn("text-sm flex-1 truncate", t.done && "line-through text-text-3")}>{t.title}</span>
            <button
              aria-label="Delete task"
              className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-text-3 hover:text-danger"
              onClick={() =>
                start(async () => {
                  setItems((prev) => prev.filter((x) => x.id !== t.id));
                  await deleteTask(t.id);
                })
              }
            >
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>
      <form
        className="mt-2 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const title = text.trim();
          if (!title) return;
          setText("");
          start(async () => {
            setItems((prev) => [...prev, { id: `tmp-${Date.now()}`, title, done: false }]);
            await addTask(title, today);
          });
        }}
      >
        <Plus size={16} className="text-text-3" />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add task"
          className="flex-1 bg-transparent text-sm placeholder:text-text-3 focus:outline-none py-1"
          aria-label="New task"
        />
        {text && <Button size="sm" type="submit">Add</Button>}
      </form>
    </Card>
  );
}

function MindsetCard({ today, mindset }: { today: string; mindset: { energy: number | null; focus: number | null; motivation: number | null } | null }) {
  const [vals, setVals] = useState({ energy: mindset?.energy ?? null, focus: mindset?.focus ?? null, motivation: mindset?.motivation ?? null });
  const [, start] = useTransition();
  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <Label>Mindset check-in</Label>
        <span className="text-xs text-text-3">1–10</span>
      </div>
      <MindsetSliders
        values={vals}
        onChange={(next) => {
          setVals(next);
          start(async () => {
            await saveMindset(today, next);
          });
        }}
      />
    </Card>
  );
}
