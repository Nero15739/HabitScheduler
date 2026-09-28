"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Archive, ArchiveRestore, ArrowLeft, Check, Clock, Flame, Layers, MapPin, Pencil, Sparkles, Star, Timer, Trash2, Trophy } from "lucide-react";
import { archiveHabit, deleteHabit, setHabitLog } from "@/app/actions/habits";
import { Button, Card, Label, StatTile, cn } from "@/components/ui";
import { colorVar } from "@/lib/colors";
import { addDays, formatTime12, monthName, startOfWeek, weekdayName } from "@/lib/dates";
import { HabitFormModal, type HabitFormValues } from "./habit-form";

type Props = {
  habit: HabitFormValues & { id: string; archived: boolean };
  today: string;
  weekStart: number;
  doneDates: string[];
  notes: { date: string; note: string }[];
  stats: { rate30: number | null; rateAll: number | null; streak: number; best: number; total: number };
};

export function HabitDetail({ habit, today, weekStart, doneDates, notes, stats }: Props) {
  const router = useRouter();
  const [edit, setEdit] = useState(false);
  const [dates, setDates] = useState(new Set(doneDates));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [, start] = useTransition();
  const doneToday = dates.has(today);
  const freqLabel =
    habit.frequency === "daily"
      ? habit.daysOfWeek.length === 7
        ? "Every day"
        : habit.daysOfWeek.map((d) => weekdayName(d)).join(", ")
      : `${habit.timesPerPeriod}× per ${habit.frequency === "weekly" ? "week" : "month"}`;

  function toggle(date: string) {
    if (date > today) return;
    const next = !dates.has(date);
    setDates((prev) => {
      const s = new Set(prev);
      if (next) s.add(date);
      else s.delete(date);
      return s;
    });
    start(async () => {
      await setHabitLog(habit.id, date, next);
    });
  }

  return (
    <div className="space-y-4 animate-fade-up">
      <Link href="/habits" className="inline-flex items-center gap-1.5 text-sm text-text-2 hover:text-text">
        <ArrowLeft size={16} /> All habits
      </Link>

      <Card className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ background: `color-mix(in oklab, ${colorVar(habit.color)} 18%, transparent)` }}>
            {habit.emoji ?? <span className="h-3 w-3 rounded-full" style={{ background: colorVar(habit.color) }} />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight truncate">{habit.name}</h2>
              {habit.kind === "break" && <span className="text-[10px] font-bold tracking-widest uppercase text-text-3 border border-border rounded-full px-2 py-0.5">Break</span>}
              {habit.archived && <span className="text-[10px] font-bold tracking-widest uppercase text-warning border border-warning/40 rounded-full px-2 py-0.5">Archived</span>}
            </div>
            <div className="text-sm text-text-2 mt-0.5 flex flex-wrap gap-x-3">
              <span>{freqLabel}</span>
              {habit.cueTime && <span className="inline-flex items-center gap-1"><Clock size={13} />{formatTime12(habit.cueTime)}</span>}
              {habit.cueLocation && <span className="inline-flex items-center gap-1"><MapPin size={13} />{habit.cueLocation}</span>}
            </div>
            {habit.identity && <div className="text-sm text-accent mt-1">“{habit.identity}”</div>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={doneToday ? "secondary" : "primary"} onClick={() => toggle(today)}>
            <Check size={16} strokeWidth={3} /> {doneToday ? "Done today" : "Mark done today"}
          </Button>
          <Button variant="secondary" onClick={() => setEdit(true)} aria-label="Edit">
            <Pencil size={16} />
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatTile label="Last 30 days" value={stats.rate30 === null ? "–" : `${stats.rate30}%`} accent />
        <StatTile label="All time" value={stats.rateAll === null ? "–" : `${stats.rateAll}%`} />
        <StatTile label="Current streak" value={<span className="inline-flex items-center gap-1"><Flame className="text-warning" size={22} />{stats.streak}</span>} />
        <StatTile label="Best streak" value={<span className="inline-flex items-center gap-1"><Star className="text-warning" size={22} />{stats.best}</span>} />
        <StatTile label="Total reps" value={<span className="inline-flex items-center gap-1"><Trophy className="text-accent" size={22} />{stats.total}</span>} />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <Label>Last 12 months</Label>
          <span className="text-xs text-text-3">Tap a day to toggle</span>
        </div>
        <Heatmap dates={dates} today={today} weekStart={weekStart} color={habit.color} onToggle={toggle} startDate={habit.startDate ?? "0000-00-00"} />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <Label className="flex items-center gap-1.5 mb-3"><Sparkles size={13} className="text-accent" /> How this habit sticks</Label>
          <dl className="space-y-3 text-sm">
            <Row icon={<Layers size={15} />} k="Habit stack" v={habit.stackAfter ? `After ${habit.stackAfter}, I will ${habit.name.toLowerCase()}.` : null} empty="Anchor it: after [current habit], I will…" />
            <Row icon={<Clock size={15} />} k="Implementation intention" v={habit.cueTime || habit.cueLocation ? `I will ${habit.name.toLowerCase()}${habit.cueTime ? ` at ${formatTime12(habit.cueTime)}` : ""}${habit.cueLocation ? ` in ${habit.cueLocation}` : ""}.` : null} empty="Make it obvious with a time and place." />
            <Row icon={<Timer size={15} />} k="Two-minute version" v={habit.twoMinuteVersion} empty="Make it easy: what's the 2-minute version?" />
            <Row icon={<Trophy size={15} />} k="Reward" v={habit.reward} empty="Make it satisfying: what happens right after?" />
          </dl>
          {habit.notes && <p className="mt-4 text-sm text-text-2 whitespace-pre-wrap">{habit.notes}</p>}
          <Button variant="ghost" size="sm" className="mt-3 -ml-2" onClick={() => setEdit(true)}>
            <Pencil size={14} /> Edit
          </Button>
        </Card>

        <Card>
          <Label className="mb-3">Notes</Label>
          <NoteForm habitId={habit.id} today={today} onSaved={() => router.refresh()} />
          {notes.length === 0 ? (
            <p className="text-sm text-text-3 mt-3">No notes yet. Add one with today&apos;s check-in.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {notes.map((n) => (
                <li key={n.date} className="py-2 text-sm">
                  <span className="text-xs text-text-3 tabular mr-2">{n.date}</span>
                  {n.note}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-sm text-text-2">
          Started {habit.startDate}. {habit.archived ? "Archived habits keep their history but stay off the dashboard." : "Archiving keeps the history but removes it from Today."}
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              start(async () => {
                await archiveHabit(habit.id, !habit.archived);
                router.refresh();
              })
            }
          >
            {habit.archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
            {habit.archived ? "Restore" : "Archive"}
          </Button>
          {confirmDelete ? (
            <Button
              variant="danger"
              size="sm"
              onClick={() =>
                start(async () => {
                  await deleteHabit(habit.id);
                  router.push("/habits");
                })
              }
            >
              Really delete?
            </Button>
          ) : (
            <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={15} /> Delete
            </Button>
          )}
        </div>
      </Card>

      <HabitFormModal open={edit} onClose={() => { setEdit(false); router.refresh(); }} initial={habit} weekStart={weekStart} />
    </div>
  );
}

function Row({ icon, k, v, empty }: { icon: React.ReactNode; k: string; v: string | null; empty: string }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 text-accent shrink-0">{icon}</span>
      <div>
        <dt className="label">{k}</dt>
        <dd className={cn("mt-0.5", v ? "" : "text-text-3 italic")}>{v ?? empty}</dd>
      </div>
    </div>
  );
}

function NoteForm({ habitId, today, onSaved }: { habitId: string; today: string; onSaved: () => void }) {
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        start(async () => {
          await setHabitLog(habitId, today, true, text.trim());
          setText("");
          onSaved();
        });
      }}
    >
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="How did today go?"
        className="flex-1 h-10 rounded-xl bg-surface-2 border border-border px-3 text-sm focus:border-accent focus:outline-none"
        aria-label="Note for today"
      />
      <Button size="sm" type="submit" disabled={pending || !text.trim()}>Save</Button>
    </form>
  );
}

function Heatmap({ dates, today, weekStart, color, onToggle, startDate }: { dates: Set<string>; today: string; weekStart: number; color: string; onToggle: (d: string) => void; startDate: string }) {
  // 53 weeks ending this week
  const end = startOfWeek(today, weekStart);
  const begin = addDays(end, -52 * 7);
  const weeks: string[][] = [];
  for (let w = 0; w < 53; w++) {
    const ws = addDays(begin, w * 7);
    weeks.push([...Array(7)].map((_, i) => addDays(ws, i)));
  }
  const monthLabels: { idx: number; label: string }[] = [];
  weeks.forEach((w, i) => {
    const firstOfMonth = w.find((d) => d.slice(8, 10) === "01");
    if (firstOfMonth) monthLabels.push({ idx: i, label: monthName(firstOfMonth, false) });
  });
  return (
    <div className="overflow-x-auto no-scrollbar">
      <div className="min-w-[720px]">
        <div className="relative h-4 mb-1 text-[10px] text-text-3">
          {monthLabels.map((m) => (
            <span key={m.idx} className="absolute" style={{ left: `${(m.idx / 53) * 100}%` }}>{m.label}</span>
          ))}
        </div>
        <div className="grid gap-[3px]" style={{ gridTemplateColumns: "repeat(53, minmax(0, 1fr))" }}>
          {weeks.map((w, wi) => (
            <div key={wi} className="grid gap-[3px]" style={{ gridTemplateRows: "repeat(7, 1fr)" }}>
              {w.map((d) => {
                const future = d > today;
                const before = d < startDate;
                const on = dates.has(d);
                return (
                  <button
                    key={d}
                    type="button"
                    disabled={future}
                    aria-label={`${d}${on ? " done" : ""}`}
                    title={d}
                    onClick={() => onToggle(d)}
                    className={cn("aspect-square w-full rounded-[3px] transition", future && "opacity-20", !on && !future && "bg-track hover:ring-1 hover:ring-accent", before && !on && "opacity-40")}
                    style={on ? { background: colorVar(color) } : undefined}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
