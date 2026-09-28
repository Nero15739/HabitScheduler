"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Archive, ArchiveRestore, Calendar, Check, CheckCircle2, Flame, Pencil, Plus, Trash2 } from "lucide-react";
import { addMilestone, deleteGoal, deleteMilestone, setGoalProgress, setGoalStatus, toggleMilestone } from "@/app/actions/goals";
import { Button, Card, EmptyState, Label, Ring, Segmented, cn } from "@/components/ui";
import { colorVar } from "@/lib/colors";
import { GoalFormModal, type GoalFormValues } from "./goal-form";

export type GoalCard = {
  id: string;
  title: string;
  description: string | null;
  identity: string | null;
  color: string;
  targetDate: string | null;
  daysLeft: number | null;
  status: "active" | "completed" | "archived";
  progress: number;
  habitIds: string[];
  milestones: { id: string; title: string; done: boolean }[];
  linkedHabits: { id: string; name: string; emoji: string | null; color: string; rate30: number | null; streak: number }[];
  milestonePct: number | null;
  habitPct: number | null;
};

type HabitOpt = { id: string; name: string; emoji: string | null; color: string };

export function GoalsView({ goals, habits }: { goals: GoalCard[]; habits: HabitOpt[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<"active" | "completed" | "archived">("active");
  const [modal, setModal] = useState<{ open: boolean; initial: GoalFormValues | null }>({ open: false, initial: null });
  const visible = goals.filter((g) => g.status === filter);
  const completed = goals.filter((g) => g.status === "completed").length;
  const activeCount = goals.filter((g) => g.status === "active").length;

  return (
    <div className="space-y-4 animate-fade-up">
      <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Label>Goals</Label>
          <div className="text-lg font-bold mt-0.5">
            {completed} / {completed + activeCount} completed
          </div>
          <p className="text-sm text-text-3">Goals set the direction. Habits are the system that gets you there.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { value: "active", label: "Active" },
              { value: "completed", label: "Done" },
              { value: "archived", label: "Archived" },
            ]}
          />
          <Button onClick={() => setModal({ open: true, initial: null })}>
            <Plus size={16} /> New goal
          </Button>
        </div>
      </Card>

      {visible.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            title={filter === "active" ? "No active goals" : `No ${filter} goals`}
            body="Write the outcome, link the habits that produce it, and break it into milestones you can tick off."
            action={filter === "active" ? <Button onClick={() => setModal({ open: true, initial: null })}><Plus size={16} /> Create a goal</Button> : undefined}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {visible.map((g) => (
            <GoalCardView key={g.id} goal={g} onEdit={() => setModal({ open: true, initial: { id: g.id, title: g.title, description: g.description, identity: g.identity, color: g.color, targetDate: g.targetDate, habitIds: g.habitIds, progress: g.progress } })} onChanged={() => router.refresh()} />
          ))}
        </div>
      )}

      <GoalFormModal open={modal.open} onClose={() => setModal({ open: false, initial: null })} initial={modal.initial} habits={habits} />
    </div>
  );
}

function GoalCardView({ goal, onEdit, onChanged }: { goal: GoalCard; onEdit: () => void; onChanged: () => void }) {
  const [ms, setMs] = useState(goal.milestones);
  const [progress, setProgress] = useState(goal.progress);
  const [newMs, setNewMs] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [, start] = useTransition();
  const color = colorVar(goal.color);
  const auto = goal.milestonePct;
  const display = ms.length ? Math.round((ms.filter((m) => m.done).length / ms.length) * 100) : progress;

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start gap-4">
        <Ring value={display} size={84} stroke={8} color={color}>
          <span className="text-base font-extrabold tabular">{display}%</span>
        </Ring>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-lg font-extrabold tracking-tight leading-tight">{goal.title}</h3>
              {goal.identity && <div className="text-sm text-accent mt-0.5">“{goal.identity}”</div>}
            </div>
            <button onClick={onEdit} aria-label="Edit goal" className="h-9 w-9 rounded-full hover:bg-surface-2 inline-flex items-center justify-center text-text-2 shrink-0">
              <Pencil size={15} />
            </button>
          </div>
          {goal.description && <p className="text-sm text-text-2 mt-1.5">{goal.description}</p>}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-text-3">
            {goal.targetDate && (
              <span className="inline-flex items-center gap-1">
                <Calendar size={12} /> {goal.targetDate}
                {goal.daysLeft !== null && goal.status === "active" && (
                  <span className={cn("ml-1 font-semibold", goal.daysLeft < 0 ? "text-danger" : goal.daysLeft <= 7 ? "text-warning" : "text-text-2")}>
                    {goal.daysLeft < 0 ? `${-goal.daysLeft}d overdue` : goal.daysLeft === 0 ? "today" : `${goal.daysLeft}d left`}
                  </span>
                )}
              </span>
            )}
            {auto !== null && <span>{ms.filter((m) => m.done).length}/{ms.length} milestones</span>}
            {goal.habitPct !== null && <span>Linked habits {goal.habitPct}% (30d)</span>}
          </div>
        </div>
      </div>

      {goal.linkedHabits.length > 0 && (
        <div>
          <Label className="mb-2">Habits driving this goal</Label>
          <div className="flex flex-wrap gap-1.5">
            {goal.linkedHabits.map((h) => (
              <span key={h.id} className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 border border-border px-2.5 h-7 text-xs font-semibold">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: colorVar(h.color) }} />
                {h.emoji} {h.name}
                <span className="text-text-3 tabular">{h.rate30 ?? "–"}%</span>
                {h.streak > 0 && <span className="inline-flex items-center text-warning tabular"><Flame size={11} />{h.streak}</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <Label className="mb-2">Milestones</Label>
        <ul className="space-y-1.5">
          {ms.map((m) => (
            <li key={m.id} className="group flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-surface-2">
              <button
                aria-label={m.done ? "Mark milestone incomplete" : "Complete milestone"}
                onClick={() => {
                  setMs((prev) => prev.map((x) => (x.id === m.id ? { ...x, done: !m.done } : x)));
                  start(async () => {
                    await toggleMilestone(m.id, !m.done);
                  });
                }}
                className={cn("h-6 w-6 rounded-md border-2 inline-flex items-center justify-center transition shrink-0", m.done ? "text-[#06201b]" : "border-border-strong hover:border-accent")}
                style={m.done ? { background: color, borderColor: color } : undefined}
              >
                {m.done && <Check size={14} strokeWidth={3} />}
              </button>
              <span className={cn("text-sm flex-1", m.done && "line-through text-text-3")}>{m.title}</span>
              <button
                aria-label="Delete milestone"
                className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-text-3 hover:text-danger"
                onClick={() => {
                  setMs((prev) => prev.filter((x) => x.id !== m.id));
                  start(async () => {
                    await deleteMilestone(m.id);
                  });
                }}
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
        <form
          className="mt-1.5 flex items-center gap-2 px-2"
          onSubmit={(e) => {
            e.preventDefault();
            const t = newMs.trim();
            if (!t) return;
            setNewMs("");
            const tmp = { id: `tmp-${Date.now()}`, title: t, done: false };
            setMs((prev) => [...prev, tmp]);
            start(async () => {
              const res = await addMilestone(goal.id, t);
              if (res.ok && res.data) setMs((prev) => prev.map((x) => (x.id === tmp.id ? { ...x, id: res.data!.id } : x)));
            });
          }}
        >
          <Plus size={15} className="text-text-3" />
          <input value={newMs} onChange={(e) => setNewMs(e.target.value)} placeholder="Add milestone" aria-label="New milestone" className="flex-1 bg-transparent text-sm py-1 focus:outline-none placeholder:text-text-3" />
          {newMs && <Button size="sm" type="submit">Add</Button>}
        </form>
      </div>

      {ms.length === 0 && goal.status === "active" && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label>Manual progress</Label>
            <span className="text-xs tabular text-text-2">{progress}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={progress}
            aria-label="Progress"
            style={{ ["--slider-color" as string]: color }}
            onChange={(e) => setProgress(Number(e.target.value))}
            onMouseUp={() => start(async () => { await setGoalProgress(goal.id, progress); onChanged(); })}
            onTouchEnd={() => start(async () => { await setGoalProgress(goal.id, progress); onChanged(); })}
            onKeyUp={() => start(async () => { await setGoalProgress(goal.id, progress); })}
          />
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border">
        <div className="flex gap-1.5">
          {goal.status !== "completed" ? (
            <Button size="sm" variant="secondary" onClick={() => start(async () => { await setGoalStatus(goal.id, "completed"); onChanged(); })}>
              <CheckCircle2 size={15} /> Complete
            </Button>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => start(async () => { await setGoalStatus(goal.id, "active"); onChanged(); })}>
              Reopen
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => start(async () => { await setGoalStatus(goal.id, goal.status === "archived" ? "active" : "archived"); onChanged(); })}>
            {goal.status === "archived" ? <ArchiveRestore size={15} /> : <Archive size={15} />}
          </Button>
        </div>
        {confirm ? (
          <Button size="sm" variant="danger" onClick={() => start(async () => { await deleteGoal(goal.id); onChanged(); })}>Really delete?</Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setConfirm(true)} aria-label="Delete goal"><Trash2 size={15} /></Button>
        )}
      </div>
    </Card>
  );
}
