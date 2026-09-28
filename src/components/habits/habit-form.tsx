"use client";

import { useMemo, useState, useTransition } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { createHabit, updateHabit, type HabitInput } from "@/app/actions/habits";
import { Button, Field, Input, Modal, Segmented, Select, Textarea, cn } from "@/components/ui";
import { COLOR_KEYS, HABIT_COLORS, colorVar } from "@/lib/colors";
import { parseHabitText } from "@/lib/nl-parse";
import { HABIT_TEMPLATES } from "@/lib/habit-templates";
import { weekdayName } from "@/lib/dates";

export type HabitFormValues = {
  id?: string;
  name: string;
  emoji: string | null;
  color: string;
  kind: "build" | "break";
  frequency: "daily" | "weekly" | "monthly";
  daysOfWeek: number[];
  timesPerPeriod: number;
  identity: string | null;
  cueTime: string | null;
  cueLocation: string | null;
  stackAfter: string | null;
  twoMinuteVersion: string | null;
  reward: string | null;
  notes: string | null;
  startDate?: string;
};

const EMPTY: HabitFormValues = {
  name: "",
  emoji: null,
  color: "mint",
  kind: "build",
  frequency: "daily",
  daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  timesPerPeriod: 3,
  identity: null,
  cueTime: null,
  cueLocation: null,
  stackAfter: null,
  twoMinuteVersion: null,
  reward: null,
  notes: null,
};

type FormProps = {
  onClose: () => void;
  initial?: HabitFormValues | null;
  weekStart: number;
  onSaved?: (id: string) => void;
};

export function HabitFormModal({ open, ...rest }: FormProps & { open: boolean }) {
  // Mounting the form only while open resets its state on every open without effects.
  if (!open) return null;
  return <HabitForm {...rest} />;
}

function HabitForm({ onClose, initial, weekStart, onSaved }: FormProps) {
  const [values, setValues] = useState<HabitFormValues>(initial ?? EMPTY);
  const [quick, setQuick] = useState("");
  const [showMore, setShowMore] = useState(!!initial?.identity || !!initial?.stackAfter || !!initial?.twoMinuteVersion);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const editing = !!initial?.id;

  const parsed = useMemo(() => (quick.trim() ? parseHabitText(quick) : null), [quick]);

  function applyQuick() {
    if (!parsed) return;
    setValues((v) => ({
      ...v,
      name: parsed.name,
      kind: parsed.kind,
      frequency: parsed.frequency,
      daysOfWeek: parsed.daysOfWeek,
      timesPerPeriod: parsed.frequency === "daily" ? v.timesPerPeriod : parsed.timesPerPeriod,
      cueTime: parsed.cueTime ?? v.cueTime,
      cueLocation: parsed.cueLocation ?? v.cueLocation,
      stackAfter: parsed.stackAfter ?? v.stackAfter,
    }));
    setQuick("");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const input: HabitInput = {
      ...values,
      cueTime: values.cueTime || null,
      timesPerPeriod: Number(values.timesPerPeriod) || 1,
    };
    start(async () => {
      const res = editing && initial?.id ? await updateHabit(initial.id, input) : await createHabit(input);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const id = editing && initial?.id ? initial.id : (res as { data?: { id: string } }).data?.id;
      if (id) onSaved?.(id);
      onClose();
    });
  }

  const days = [...Array(7)].map((_, i) => (weekStart + i) % 7);

  return (
    <Modal open onClose={onClose} title={editing ? "Edit habit" : "New habit"} wide>
      <form onSubmit={submit} className="space-y-5">
        {!editing && (
          <div className="rounded-2xl border border-accent/30 bg-accent-soft/60 p-3.5">
            <div className="flex items-center gap-2 text-xs font-bold text-accent uppercase tracking-widest mb-2">
              <Sparkles size={14} /> Quick add
            </div>
            <div className="flex gap-2">
              <Input
                value={quick}
                onChange={(e) => setQuick(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyQuick();
                  }
                }}
                placeholder='e.g. "Read 10 pages every weekday at 9pm after I get into bed"'
                className="bg-surface"
              />
              <Button type="button" variant="secondary" onClick={applyQuick} disabled={!parsed}>
                Use
              </Button>
            </div>
            {parsed && (
              <div className="mt-2 text-xs text-text-2 flex flex-wrap gap-x-3 gap-y-1">
                <span className="font-semibold text-text">{parsed.name}</span>
                <span>{parsed.frequency === "daily" ? (parsed.daysOfWeek.length === 7 ? "every day" : parsed.daysOfWeek.map((d) => weekdayName(d)).join(", ")) : `${parsed.timesPerPeriod}× per ${parsed.frequency === "weekly" ? "week" : "month"}`}</span>
                {parsed.cueTime && <span>at {parsed.cueTime}</span>}
                {parsed.cueLocation && <span>in {parsed.cueLocation}</span>}
                {parsed.stackAfter && <span>after {parsed.stackAfter}</span>}
                {parsed.kind === "break" && <span className="text-danger">break habit</span>}
              </div>
            )}
            <div className="mt-3 flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1">
              {HABIT_TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => setValues((v) => ({ ...EMPTY, ...v, ...t.input, emoji: t.emoji, name: t.input.name ?? t.label, daysOfWeek: (t.input.daysOfWeek as number[] | undefined) ?? [0, 1, 2, 3, 4, 5, 6], timesPerPeriod: t.input.timesPerPeriod ?? 3, cueTime: t.input.cueTime ?? null, cueLocation: null, identity: t.input.identity ?? null, stackAfter: t.input.stackAfter ?? null, twoMinuteVersion: t.input.twoMinuteVersion ?? null, reward: null, notes: null, color: t.input.color ?? "mint", kind: t.input.kind ?? "build", frequency: t.input.frequency ?? "daily" }))}
                  className="shrink-0 rounded-full border border-border bg-surface px-3 h-8 text-xs font-semibold hover:border-accent transition"
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-[72px_1fr] gap-3">
          <Field label="Emoji">
            <Input value={values.emoji ?? ""} onChange={(e) => setValues({ ...values, emoji: e.target.value.slice(0, 4) || null })} placeholder="✨" className="text-center text-xl" />
          </Field>
          <Field label="Name">
            <Input value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} placeholder="Meditate" required autoFocus={!editing} />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <span className="label">Type</span>
            <Segmented
              value={values.kind}
              onChange={(kind) => setValues({ ...values, kind })}
              options={[
                { value: "build", label: "Build" },
                { value: "break", label: "Break" },
              ]}
              size="lg"
            />
          </div>
          <div className="space-y-1.5">
            <span className="label">Frequency</span>
            <Segmented
              value={values.frequency}
              onChange={(frequency) => setValues({ ...values, frequency })}
              options={[
                { value: "daily", label: "Daily" },
                { value: "weekly", label: "Weekly" },
                { value: "monthly", label: "Monthly" },
              ]}
              size="lg"
            />
          </div>
        </div>

        {values.frequency === "daily" ? (
          <div className="space-y-1.5">
            <span className="label">On these days</span>
            <div className="flex gap-1.5 flex-wrap">
              {days.map((d) => {
                const on = values.daysOfWeek.includes(d);
                return (
                  <button
                    type="button"
                    key={d}
                    aria-pressed={on}
                    onClick={() =>
                      setValues({
                        ...values,
                        daysOfWeek: on ? values.daysOfWeek.filter((x) => x !== d) : [...values.daysOfWeek, d].sort(),
                      })
                    }
                    className={cn("h-10 w-11 rounded-full text-xs font-bold transition border", on ? "bg-accent text-accent-fg border-accent" : "bg-surface-2 text-text-2 border-border hover:border-accent")}
                  >
                    {weekdayName(d).slice(0, 2)}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <Field label={`Target per ${values.frequency === "weekly" ? "week" : "month"}`}>
            <Select value={values.timesPerPeriod} onChange={(e) => setValues({ ...values, timesPerPeriod: Number(e.target.value) })}>
              {[...Array(values.frequency === "weekly" ? 7 : 31)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}× per {values.frequency === "weekly" ? "week" : "month"}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <div className="space-y-1.5">
          <span className="label">Color</span>
          <div className="flex gap-2 flex-wrap">
            {COLOR_KEYS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={HABIT_COLORS[c].label}
                aria-pressed={values.color === c}
                onClick={() => setValues({ ...values, color: c })}
                className={cn("h-8 w-8 rounded-full transition ring-offset-2 ring-offset-surface", values.color === c && "ring-2 ring-text")}
                style={{ background: colorVar(c) }}
              />
            ))}
          </div>
        </div>

        <button type="button" onClick={() => setShowMore((s) => !s)} className="flex items-center gap-2 text-sm font-bold text-accent">
          <ChevronDown size={16} className={cn("transition", showMore && "rotate-180")} />
          Make it stick (Atomic Habits)
        </button>
        {showMore && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-up">
            <Field label="Identity" hint="Who does this habit make you?">
              <Input value={values.identity ?? ""} onChange={(e) => setValues({ ...values, identity: e.target.value })} placeholder="I am a reader" />
            </Field>
            <Field label="Habit stack" hint="After [current habit], I will [this habit].">
              <Input value={values.stackAfter ?? ""} onChange={(e) => setValues({ ...values, stackAfter: e.target.value })} placeholder="I pour my morning coffee" />
            </Field>
            <Field label="Cue time" hint="Make it obvious: a specific time.">
              <Input type="time" value={values.cueTime ?? ""} onChange={(e) => setValues({ ...values, cueTime: e.target.value || null })} />
            </Field>
            <Field label="Cue location" hint="...and a specific place.">
              <Input value={values.cueLocation ?? ""} onChange={(e) => setValues({ ...values, cueLocation: e.target.value })} placeholder="the kitchen table" />
            </Field>
            <Field label="Two-minute version" hint="Make it easy: the version that takes under two minutes.">
              <Input value={values.twoMinuteVersion ?? ""} onChange={(e) => setValues({ ...values, twoMinuteVersion: e.target.value })} placeholder="Read one page" />
            </Field>
            <Field label="Reward" hint="Make it satisfying: what happens right after?">
              <Input value={values.reward ?? ""} onChange={(e) => setValues({ ...values, reward: e.target.value })} placeholder="Tick it off and make a tea" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Notes">
                <Textarea value={values.notes ?? ""} onChange={(e) => setValues({ ...values, notes: e.target.value })} placeholder="Anything else that helps" />
              </Field>
            </div>
            {editing && (
              <Field label="Start date" hint="Days before this aren't counted against you.">
                <Input type="date" value={values.startDate ?? ""} onChange={(e) => setValues({ ...values, startDate: e.target.value || undefined })} />
              </Field>
            )}
          </div>
        )}

        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={pending || !values.name.trim()}>
            {pending ? "Saving…" : editing ? "Save changes" : "Create habit"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
