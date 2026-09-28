"use client";

import { useRouter } from "next/navigation";
import { useMemo, useOptimistic, useState, useTransition } from "react";
import { Check, ChevronDown, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { addTask, deleteTask, saveMindset, toggleTask } from "@/app/actions/tasks";
import { Button, Card, IconButton, Label, Ring, cn } from "@/components/ui";
import { addDays, formatNumeric, formatRange, weekdayLong, weekdayShort } from "@/lib/dates";
import { MindsetSliders } from "@/components/mindset-sliders";
import { MindsetChart } from "./mindset-chart";

type TaskItem = { id: string; title: string; date: string; done: boolean };
type Mind = { date: string; energy: number | null; focus: number | null; motivation: number | null };

type Props = { today: string; from: string; to: string; days: string[]; tasks: TaskItem[]; mindset: Mind[] };

export function TasksView(p: Props) {
  const router = useRouter();
  const [tasks, setTasks] = useOptimistic(p.tasks);
  const [mind, setMind] = useState<Record<string, Mind>>(() => Object.fromEntries(p.mindset.map((m) => [m.date, m])));
  const [, start] = useTransition();
  const isThisWeek = p.today >= p.from && p.today <= p.to;

  const perDay = useMemo(
    () =>
      p.days.map((d) => {
        const list = tasks.filter((t) => t.date === d);
        const done = list.filter((t) => t.done).length;
        return { date: d, list, done, total: list.length, pct: list.length ? Math.round((done / list.length) * 100) : 0 };
      }),
    [p.days, tasks],
  );
  const totalDone = perDay.reduce((a, d) => a + d.done, 0);
  const total = perDay.reduce((a, d) => a + d.total, 0);
  const overall = total ? Math.round((totalDone / total) * 100) : 0;
  const maxTotal = Math.max(1, ...perDay.map((d) => d.total));

  function nav(delta: number) {
    router.push(`/tasks?w=${addDays(p.from, delta * 7)}`);
  }

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Overall progress */}
        <Card>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <Label>Week starting</Label>
              <div className="mt-1 inline-flex items-center rounded-full bg-accent text-accent-fg px-3.5 h-8 text-sm font-bold tabular">{formatRange(p.from, p.to)}</div>
            </div>
            <div className="flex items-center gap-2">
              <IconButton aria-label="Previous week" onClick={() => nav(-1)}><ChevronLeft size={18} /></IconButton>
              <button onClick={() => router.push("/tasks")} className={cn("h-10 px-4 rounded-full border text-sm font-semibold", isThisWeek ? "border-accent text-accent" : "border-border text-text-2 hover:text-text")}>
                This week
              </button>
              <IconButton aria-label="Next week" onClick={() => nav(1)}><ChevronRight size={18} /></IconButton>
            </div>
          </div>
          <div className="mt-5 flex items-end gap-4">
            <div className="flex-1">
              <Label className="text-center mb-3">Overall progress</Label>
              <div className="grid grid-cols-7 gap-2 items-end h-[132px]">
                {perDay.map((d) => (
                  <div key={d.date} className="flex flex-col items-center gap-1.5 h-full justify-end">
                    <div className="w-full max-w-[34px] flex-1 flex items-end rounded-full bg-track overflow-hidden relative" title={`${d.done}/${d.total}`}>
                      <div className="absolute inset-x-0 bottom-0 rounded-full bg-surface-3" style={{ height: `${(d.total / maxTotal) * 100}%` }} />
                      <div className="absolute inset-x-0 bottom-0 rounded-full bg-accent" style={{ height: `${(d.done / maxTotal) * 100}%`, transition: "height 400ms" }} />
                    </div>
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider", d.date === p.today ? "text-accent" : "text-text-3")}>{weekdayShort(d.date)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-center gap-1 shrink-0">
              <Ring value={overall} size={104} stroke={9}>
                <span className="text-xl font-extrabold tabular">{overall}%</span>
              </Ring>
              <span className="text-xs text-text-3 tabular">{totalDone} / {total} completed</span>
            </div>
          </div>
        </Card>

        {/* Mindset tracker */}
        <Card>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Label>Mindset tracker</Label>
            <div className="flex items-center gap-3 text-[11px] text-text-2">
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: "var(--series-energy)" }} />Energy</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: "var(--series-focus)" }} />Focus</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: "var(--series-motivation)" }} />Motivation</span>
            </div>
          </div>
          <div className="mt-3 h-[190px]">
            <MindsetChart days={p.days} data={p.days.map((d) => mind[d] ?? { date: d, energy: null, focus: null, motivation: null })} />
          </div>
        </Card>
      </div>

      {/* Day columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {perDay.map((d) => (
          <DayColumn
            key={d.date}
            date={d.date}
            isToday={d.date === p.today}
            pct={d.pct}
            done={d.done}
            total={d.total}
            tasks={d.list}
            mind={mind[d.date] ?? { date: d.date, energy: null, focus: null, motivation: null }}
            onMind={(m) => {
              setMind((prev) => ({ ...prev, [d.date]: m }));
              start(async () => {
                await saveMindset(d.date, m);
              });
            }}
            onAdd={(title) =>
              start(async () => {
                setTasks((prev) => [...prev, { id: `tmp-${Date.now()}`, title, date: d.date, done: false }]);
                await addTask(title, d.date);
              })
            }
            onToggle={(t) =>
              start(async () => {
                setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, done: !t.done } : x)));
                await toggleTask(t.id, !t.done);
              })
            }
            onDelete={(t) =>
              start(async () => {
                setTasks((prev) => prev.filter((x) => x.id !== t.id));
                await deleteTask(t.id);
              })
            }
          />
        ))}
      </div>
    </div>
  );
}

function DayColumn(props: {
  date: string;
  isToday: boolean;
  pct: number;
  done: number;
  total: number;
  tasks: TaskItem[];
  mind: Mind;
  onMind: (m: Mind) => void;
  onAdd: (title: string) => void;
  onToggle: (t: TaskItem) => void;
  onDelete: (t: TaskItem) => void;
}) {
  const [text, setText] = useState("");
  const [adding, setAdding] = useState(false);
  const [showMind, setShowMind] = useState(false);
  return (
    <Card className={cn("p-4 flex flex-col", props.isToday && "border-accent/50")}>
      <div className="text-center">
        <div className={cn("font-extrabold", props.isToday && "text-accent")}>{weekdayLong(props.date)}</div>
        <div className="text-[11px] text-text-3 tabular">{formatNumeric(props.date)}</div>
      </div>
      <div className="flex justify-center my-4">
        <Ring value={props.pct} size={92} stroke={8}>
          <span className="text-lg font-extrabold tabular">{props.pct}%</span>
        </Ring>
      </div>
      <Label className="text-center mb-2">Tasks</Label>
      <ul className="space-y-1.5">
        {props.tasks.map((t) => (
          <li key={t.id} className="group flex items-center gap-2 rounded-xl bg-surface-2 border border-border px-2.5 py-2">
            <button
              aria-label={t.done ? "Mark not done" : "Mark done"}
              onClick={() => props.onToggle(t)}
              className={cn("h-5 w-5 rounded-md border-2 inline-flex items-center justify-center shrink-0 transition", t.done ? "bg-accent border-accent text-accent-fg" : "border-border-strong hover:border-accent")}
            >
              {t.done && <Check size={12} strokeWidth={3.5} />}
            </button>
            <span className={cn("text-[13px] flex-1 leading-snug break-words", t.done && "line-through text-text-3")}>{t.title}</span>
            <button aria-label="Delete task" onClick={() => props.onDelete(t)} className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-text-3 hover:text-danger shrink-0">
              <Trash2 size={13} />
            </button>
          </li>
        ))}
      </ul>
      {adding ? (
        <form
          className="mt-2 flex gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            const v = text.trim();
            if (v) props.onAdd(v);
            setText("");
            setAdding(false);
          }}
        >
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={() => { if (!text.trim()) setAdding(false); }}
            placeholder="Task"
            className="flex-1 min-w-0 h-9 rounded-xl bg-surface-2 border border-border px-2.5 text-[13px] focus:border-accent focus:outline-none"
            aria-label="New task title"
          />
          <Button size="sm" type="submit">Add</Button>
        </form>
      ) : (
        <button onClick={() => setAdding(true)} className="mt-2 text-xs font-semibold text-text-3 hover:text-accent inline-flex items-center gap-1 self-start px-1">
          <Plus size={13} /> Add task
        </button>
      )}
      <div className="mt-auto pt-3">
        <button onClick={() => setShowMind((s) => !s)} className="w-full flex items-center justify-between label hover:text-text">
          Mindset <ChevronDown size={14} className={cn("transition", showMind && "rotate-180")} />
        </button>
        {showMind ? (
          <div className="mt-2">
            <MindsetSliders compact values={props.mind} onChange={(v) => props.onMind({ ...props.mind, ...v })} />
          </div>
        ) : (
          <div className="mt-2 grid grid-cols-2 gap-x-2 text-[11px] text-text-3">
            <span>Completed</span><span className="text-right tabular text-accent">{props.done}</span>
            <span>Not completed</span><span className="text-right tabular">{props.total - props.done}</span>
            {(props.mind.energy || props.mind.focus || props.mind.motivation) ? (
              <>
                <span>Mindset</span>
                <span className="text-right tabular">{[props.mind.energy, props.mind.focus, props.mind.motivation].map((v) => v ?? "–").join(" · ")}</span>
              </>
            ) : null}
          </div>
        )}
      </div>
    </Card>
  );
}
