"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useOptimistic, useRef, useState, useTransition } from "react";
import { Check, ChevronLeft, ChevronRight, Flame, Plus, Star } from "lucide-react";
import { setHabitLog } from "@/app/actions/habits";
import { Button, Card, EmptyState, IconButton, Label, Ring, Segmented, cn } from "@/components/ui";
import { colorVar } from "@/lib/colors";
import { addDays, addMonths, endOfMonth, endOfWeek, monthName, startOfMonth, weekdayName, weekdayOf } from "@/lib/dates";
import { monthGridWeeks } from "@/lib/habit-stats";
import { HabitFormModal, type HabitFormValues } from "./habit-form";
import { Sparkline } from "./sparkline";

export type HabitRow = {
  id: string;
  name: string;
  emoji: string | null;
  color: string;
  kind: "build" | "break";
  frequency: "daily" | "weekly" | "monthly";
  daysOfWeek: number[];
  timesPerPeriod: number;
  startDate: string;
  doneDates: string[];
  pct: number | null;
  streak: number;
  best: number;
};

type View = "daily" | "weekly" | "monthly";

type Props = {
  view: View;
  month: string; // first day of month
  today: string;
  weekStart: number;
  rows: HabitRow[];
  allHabits: HabitFormValues[];
  trend: { date: string; pct: number | null }[];
  avg: number | null;
  todayDone: number;
  todayTotal: number;
  openNew: boolean;
};

type Column = { key: string; label: string; sub?: string; from: string; to: string; future: boolean; isToday?: boolean };

export function HabitsView(p: Props) {
  const router = useRouter();
  const [modal, setModal] = useState<{ open: boolean; initial: HabitFormValues | null }>({ open: p.openNew, initial: null });
  const [rows, setRows] = useOptimistic(p.rows);
  const [, start] = useTransition();

  const columns = useMemo<Column[]>(() => buildColumns(p.view, p.month, p.today, p.weekStart), [p.view, p.month, p.today, p.weekStart]);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLTableCellElement>(null);

  // Keep today in view on narrow screens.
  useEffect(() => {
    const el = scrollerRef.current;
    const th = todayRef.current;
    if (!el || !th) return;
    const target = th.offsetLeft - el.clientWidth / 2 + th.clientWidth / 2;
    if (target > 0) el.scrollLeft = target;
  }, [p.view, p.month]);

  function nav(delta: number) {
    const next = p.view === "monthly" ? addMonths(p.month, 12 * delta) : addMonths(p.month, delta);
    router.push(`/habits?v=${p.view}&m=${next.slice(0, 7)}`);
  }
  function setView(v: View) {
    router.push(`/habits?v=${v}&m=${p.month.slice(0, 7)}`);
  }

  function toggle(row: HabitRow, col: Column) {
    if (col.future) return;
    const inCol = row.doneDates.filter((d) => d >= col.from && d <= col.to).sort();
    const target = row.frequency === "daily" ? 1 : row.timesPerPeriod;
    let date: string;
    let done: boolean;
    if (row.frequency === "daily") {
      date = col.from;
      done = !inCol.length;
    } else if (inCol.length >= target) {
      // Fully done: remove the latest completion
      date = inCol[inCol.length - 1];
      done = false;
    } else {
      // Add a completion: today if within column, else the last non-future day in the column not already logged
      const cap = col.to < p.today ? col.to : p.today;
      let candidate = cap;
      let guard = 0;
      while (inCol.includes(candidate) && candidate >= col.from && guard++ < 40) candidate = addDays(candidate, -1);
      if (candidate < col.from) return;
      date = candidate;
      done = true;
    }
    start(async () => {
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, doneDates: done ? [...r.doneDates, date] : r.doneDates.filter((d) => d !== date) } : r)),
      );
      await setHabitLog(row.id, date, done);
    });
  }

  const headerTitle =
    p.view === "monthly" ? p.month.slice(0, 4) : `${monthName(p.month)} ${p.month.slice(0, 4)}`;
  const isCurrentMonth = p.month === startOfMonth(p.today);

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Summary header */}
      <Card className="flex items-center justify-between gap-3 py-4">
        <div className="min-w-0">
          <Label>{headerTitle}</Label>
          <div className="text-base font-bold mt-0.5 truncate">
            {isCurrentMonth || p.view === "monthly" ? `${p.todayDone}/${p.todayTotal} habits done today` : "Monthly summary"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <IconButton aria-label="Previous" onClick={() => nav(-1)}>
            <ChevronLeft size={18} />
          </IconButton>
          <IconButton aria-label="Next" onClick={() => nav(1)}>
            <ChevronRight size={18} />
          </IconButton>
        </div>
      </Card>

      {/* View switch + new habit */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Segmented
          className="flex-1"
          size="lg"
          value={p.view}
          onChange={setView}
          options={[
            { value: "daily", label: "Daily" },
            { value: "weekly", label: "Weekly" },
            { value: "monthly", label: "Monthly" },
          ]}
        />
        <Button size="lg" onClick={() => setModal({ open: true, initial: null })} className="sm:w-auto">
          <Plus size={18} /> New Habit
        </Button>
      </div>

      {/* Grid */}
      <Card className="p-0 overflow-hidden">
        {p.view === "daily" && p.trend.length > 0 && (
          <div className="flex items-center gap-4 px-4 sm:px-5 pt-4">
            <div className="hidden sm:block w-[150px] shrink-0">
              <Label className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> Trend</Label>
            </div>
            <div className="flex-1 min-w-0">
              <Sparkline points={p.trend.map((t) => t.pct)} height={56} className="w-full" />
            </div>
            <div className="shrink-0 flex flex-col items-center">
              <Label>Avg</Label>
              <Ring value={p.avg ?? 0} size={54} stroke={5}>
                <span className="text-xs font-extrabold tabular text-accent">{p.avg === null ? "–" : `${p.avg}%`}</span>
              </Ring>
            </div>
          </div>
        )}

        {rows.length === 0 ? (
          <EmptyState
            title={`No ${p.view} habits yet`}
            body={
              p.view === "daily"
                ? "Daily habits show up here with a checkbox for every day of the month."
                : p.view === "weekly"
                  ? "Weekly habits have a target per week, like Gym 4× per week."
                  : "Monthly habits are the once-a-month rituals: budget review, deep clean, call the dentist."
            }
            action={
              <Button onClick={() => setModal({ open: true, initial: null })}>
                <Plus size={16} /> Add a {p.view} habit
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto no-scrollbar" ref={scrollerRef}>
            <table className="border-separate border-spacing-0 w-full min-w-max">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-surface text-left px-4 sm:px-5 py-3 label font-bold">Habit</th>
                  {columns.map((c) => (
                    <th key={c.key} ref={c.isToday ? todayRef : undefined} className={cn("px-0.5 py-3 text-center label font-bold", c.isToday && "text-accent")}>
                      <div>{c.label}</div>
                      {c.sub && <div className="text-[9px] font-semibold opacity-70">{c.sub}</div>}
                    </th>
                  ))}
                  <th className="sticky right-0 z-10 bg-surface px-4 py-3 text-right label font-bold">Stats</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="group">
                    <td className="sticky left-0 z-10 bg-surface group-hover:bg-surface-2 px-4 sm:px-5 py-1.5 border-t border-border max-w-[160px] sm:max-w-[200px]">
                      <Link href={`/habits/${row.id}`} className="flex items-center gap-2 min-w-0">
                        <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: colorVar(row.color) }} aria-hidden />
                        <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider truncate">
                          {row.emoji && <span className="mr-1">{row.emoji}</span>}
                          {row.name}
                        </span>
                      </Link>
                    </td>
                    {columns.map((c) => {
                      const state = cellState(row, c);
                      return (
                        <td key={c.key} className="px-0.5 py-1.5 border-t border-border text-center group-hover:bg-surface-2">
                          <Cell state={state} color={row.color} onClick={() => toggle(row, c)} label={`${row.name} ${c.label}`} />
                        </td>
                      );
                    })}
                    <td className="sticky right-0 z-10 bg-surface group-hover:bg-surface-2 px-4 py-1.5 border-t border-border text-right">
                      <div className="inline-flex items-center gap-2.5 text-[11px] font-bold tabular whitespace-nowrap">
                        <span className="text-accent">{row.pct === null ? "–" : `${row.pct}%`}</span>
                        <span className="inline-flex items-center gap-0.5 text-warning"><Flame size={12} />{row.streak}</span>
                        <span className="inline-flex items-center gap-0.5 text-text-2"><Star size={12} className="text-warning" />{row.best}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <HabitFormModal
        open={modal.open}
        onClose={() => {
          setModal({ open: false, initial: null });
          if (p.openNew) router.replace(`/habits?v=${p.view}&m=${p.month.slice(0, 7)}`);
        }}
        initial={modal.initial}
        weekStart={p.weekStart}
      />
    </div>
  );
}

type CellState = "done" | "partial" | "todo" | "future" | "off" | "before";

function cellState(row: HabitRow, c: Column): CellState {
  if (c.to < row.startDate) return "before";
  if (c.future) return "future";
  const inCol = row.doneDates.filter((d) => d >= c.from && d <= c.to).length;
  if (row.frequency === "daily") {
    if (!row.daysOfWeek.includes(weekdayOf(c.from))) return inCol ? "done" : "off";
    return inCol ? "done" : "todo";
  }
  const target = Math.max(1, row.timesPerPeriod);
  if (inCol >= target) return "done";
  if (inCol > 0) return "partial";
  return "todo";
}

function Cell({ state, color, onClick, label }: { state: CellState; color: string; onClick: () => void; label: string }) {
  const disabled = state === "future" || state === "before";
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={state === "done"}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border-2 transition",
        state === "done" && "animate-pop border-transparent text-[#06201b]",
        state === "partial" && "border-dashed",
        state === "todo" && "border-border-strong hover:border-accent",
        state === "off" && "border-border opacity-40 hover:opacity-100 hover:border-accent",
        state === "future" && "border-border opacity-30",
        state === "before" && "border-transparent opacity-20",
      )}
      style={
        state === "done"
          ? { background: colorVar(color) }
          : state === "partial"
            ? { borderColor: colorVar(color) }
            : undefined
      }
    >
      {state === "done" && <Check size={15} strokeWidth={3.2} />}
      {state === "partial" && <span className="h-2 w-2 rounded-full" style={{ background: colorVar(color) }} />}
      {state === "before" && <span className="text-text-3">·</span>}
    </button>
  );
}

function buildColumns(view: View, month: string, today: string, weekStart: number): Column[] {
  if (view === "daily") {
    const last = endOfMonth(month);
    const out: Column[] = [];
    let d = month;
    while (d <= last) {
      out.push({ key: d, label: String(Number(d.slice(8, 10))), sub: weekdayName(weekdayOf(d)).slice(0, 1), from: d, to: d, future: d > today, isToday: d === today });
      d = addDays(d, 1);
    }
    return out;
  }
  if (view === "weekly") {
    return monthGridWeeks(month, weekStart).map((s, i) => {
      const e = endOfWeek(s, weekStart);
      return { key: s, label: `W${i + 1}`, sub: `${Number(s.slice(8, 10))}–${Number(e.slice(8, 10))}`, from: s, to: e, future: s > today, isToday: today >= s && today <= e };
    });
  }
  const year = month.slice(0, 4);
  return [...Array(12)].map((_, i) => {
    const s = `${year}-${String(i + 1).padStart(2, "0")}-01`;
    const e = endOfMonth(s);
    return { key: s, label: monthName(s, false), from: s, to: e, future: s > today, isToday: today >= s && today <= e };
  });
}
