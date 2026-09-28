"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { createGoal, updateGoal } from "@/app/actions/goals";
import { Button, Field, Input, Modal, Textarea, cn } from "@/components/ui";
import { COLOR_KEYS, HABIT_COLORS, colorVar } from "@/lib/colors";

export type GoalFormValues = {
  id?: string;
  title: string;
  description: string | null;
  identity: string | null;
  color: string;
  targetDate: string | null;
  habitIds: string[];
  progress: number;
};

const EMPTY: GoalFormValues = { title: "", description: null, identity: null, color: "mint", targetDate: null, habitIds: [], progress: 0 };

type FormProps = { onClose: () => void; initial: GoalFormValues | null; habits: { id: string; name: string; emoji: string | null; color: string }[] };

export function GoalFormModal({ open, ...rest }: FormProps & { open: boolean }) {
  if (!open) return null;
  return <GoalForm {...rest} />;
}

function GoalForm({ onClose, initial, habits }: FormProps) {
  const [v, setV] = useState<GoalFormValues>(initial ?? EMPTY);
  const [milestones, setMilestones] = useState<string[]>([]);
  const [msText, setMsText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const editing = !!initial?.id;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const input = { ...v, milestones };
      const res = editing && initial?.id ? await updateGoal(initial.id, input) : await createGoal(input);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onClose();
    });
  }

  return (
    <Modal open onClose={onClose} title={editing ? "Edit goal" : "New goal"} wide>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Goal">
          <Input value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} placeholder="Run a half marathon" required autoFocus />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Identity" hint="Who is the person who achieves this?">
            <Input value={v.identity ?? ""} onChange={(e) => setV({ ...v, identity: e.target.value })} placeholder="I am a runner" />
          </Field>
          <Field label="Target date">
            <Input type="date" value={v.targetDate ?? ""} onChange={(e) => setV({ ...v, targetDate: e.target.value || null })} />
          </Field>
        </div>
        <Field label="Why it matters">
          <Textarea value={v.description ?? ""} onChange={(e) => setV({ ...v, description: e.target.value })} placeholder="What changes when this is done?" />
        </Field>

        <div className="space-y-1.5">
          <span className="label">Habits that drive this goal</span>
          {habits.length === 0 ? (
            <p className="text-sm text-text-3">Create habits first, then link them here.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {habits.map((h) => {
                const on = v.habitIds.includes(h.id);
                return (
                  <button
                    key={h.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setV({ ...v, habitIds: on ? v.habitIds.filter((x) => x !== h.id) : [...v.habitIds, h.id] })}
                    className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 h-8 text-xs font-semibold transition", on ? "border-accent bg-accent-soft text-text" : "border-border bg-surface-2 text-text-2 hover:border-accent")}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: colorVar(h.color) }} />
                    {h.emoji} {h.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <span className="label">{editing ? "Add milestones" : "Milestones"}</span>
          <ul className="space-y-1">
            {milestones.map((m, i) => (
              <li key={i} className="flex items-center gap-2 text-sm rounded-xl bg-surface-2 border border-border px-3 py-1.5">
                <span className="flex-1">{m}</span>
                <button type="button" aria-label="Remove" onClick={() => setMilestones(milestones.filter((_, j) => j !== i))} className="text-text-3 hover:text-danger"><X size={14} /></button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Input
              value={msText}
              onChange={(e) => setMsText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (msText.trim()) {
                    setMilestones([...milestones, msText.trim()]);
                    setMsText("");
                  }
                }
              }}
              placeholder="Run 5k without stopping"
            />
            <Button type="button" variant="secondary" onClick={() => { if (msText.trim()) { setMilestones([...milestones, msText.trim()]); setMsText(""); } }}>
              <Plus size={16} />
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="label">Color</span>
          <div className="flex gap-2 flex-wrap">
            {COLOR_KEYS.map((c) => (
              <button key={c} type="button" aria-label={HABIT_COLORS[c].label} aria-pressed={v.color === c} onClick={() => setV({ ...v, color: c })} className={cn("h-8 w-8 rounded-full ring-offset-2 ring-offset-surface", v.color === c && "ring-2 ring-text")} style={{ background: colorVar(c) }} />
            ))}
          </div>
        </div>

        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={pending || !v.title.trim()}>{pending ? "Saving…" : editing ? "Save changes" : "Create goal"}</Button>
        </div>
      </form>
    </Modal>
  );
}
