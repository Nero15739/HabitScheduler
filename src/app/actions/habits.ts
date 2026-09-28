"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { habitLogs, habits } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { isValidISODate, todayInTimezone } from "@/lib/dates";
import { newId } from "@/lib/ids";
import { COLOR_KEYS } from "@/lib/colors";

const habitSchema = z.object({
  name: z.string().trim().min(1, "Give the habit a name.").max(120),
  emoji: z.string().trim().max(8).optional().nullable(),
  color: z.string().refine((c) => COLOR_KEYS.includes(c), "Pick a color").default("mint"),
  kind: z.enum(["build", "break"]).default("build"),
  frequency: z.enum(["daily", "weekly", "monthly"]).default("daily"),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1).default([0, 1, 2, 3, 4, 5, 6]),
  timesPerPeriod: z.number().int().min(1).max(31).default(1),
  identity: z.string().trim().max(200).optional().nullable(),
  cueTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable().or(z.literal("")),
  cueLocation: z.string().trim().max(120).optional().nullable(),
  stackAfter: z.string().trim().max(160).optional().nullable(),
  twoMinuteVersion: z.string().trim().max(200).optional().nullable(),
  reward: z.string().trim().max(200).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  startDate: z.string().refine(isValidISODate).optional(),
});

export type HabitInput = z.input<typeof habitSchema>;
export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

function nullIfEmpty(v: string | null | undefined): string | null {
  return v && v.trim() ? v.trim() : null;
}

export async function createHabit(input: HabitInput): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = habitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid habit" };
  const d = parsed.data;
  const db = getDb();
  const max = db
    .select({ m: sql<number>`coalesce(max(${habits.sortOrder}), -1)` })
    .from(habits)
    .where(eq(habits.userId, user.id))
    .get();
  const id = newId();
  db.insert(habits)
    .values({
      id,
      userId: user.id,
      name: d.name,
      emoji: nullIfEmpty(d.emoji),
      color: d.color,
      kind: d.kind,
      frequency: d.frequency,
      daysOfWeek: JSON.stringify(d.frequency === "daily" ? [...new Set(d.daysOfWeek)].sort() : [0, 1, 2, 3, 4, 5, 6]),
      timesPerPeriod: d.frequency === "daily" ? 1 : d.timesPerPeriod,
      identity: nullIfEmpty(d.identity),
      cueTime: nullIfEmpty(d.cueTime),
      cueLocation: nullIfEmpty(d.cueLocation),
      stackAfter: nullIfEmpty(d.stackAfter),
      twoMinuteVersion: nullIfEmpty(d.twoMinuteVersion),
      reward: nullIfEmpty(d.reward),
      notes: nullIfEmpty(d.notes),
      startDate: d.startDate ?? todayInTimezone(user.timezone),
      sortOrder: (max?.m ?? -1) + 1,
    })
    .run();
  revalidatePath("/", "layout");
  return { ok: true, data: { id } };
}

export async function updateHabit(id: string, input: HabitInput): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = habitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid habit" };
  const d = parsed.data;
  const res = getDb()
    .update(habits)
    .set({
      name: d.name,
      emoji: nullIfEmpty(d.emoji),
      color: d.color,
      kind: d.kind,
      frequency: d.frequency,
      daysOfWeek: JSON.stringify(d.frequency === "daily" ? [...new Set(d.daysOfWeek)].sort() : [0, 1, 2, 3, 4, 5, 6]),
      timesPerPeriod: d.frequency === "daily" ? 1 : d.timesPerPeriod,
      identity: nullIfEmpty(d.identity),
      cueTime: nullIfEmpty(d.cueTime),
      cueLocation: nullIfEmpty(d.cueLocation),
      stackAfter: nullIfEmpty(d.stackAfter),
      twoMinuteVersion: nullIfEmpty(d.twoMinuteVersion),
      reward: nullIfEmpty(d.reward),
      notes: nullIfEmpty(d.notes),
      ...(d.startDate ? { startDate: d.startDate } : {}),
    })
    .where(and(eq(habits.id, id), eq(habits.userId, user.id)))
    .run();
  if (!res.changes) return { ok: false, error: "Habit not found" };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function archiveHabit(id: string, archived = true): Promise<ActionResult> {
  const user = await requireUser();
  getDb()
    .update(habits)
    .set({ archivedAt: archived ? new Date().toISOString() : null })
    .where(and(eq(habits.id, id), eq(habits.userId, user.id)))
    .run();
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteHabit(id: string): Promise<ActionResult> {
  const user = await requireUser();
  getDb().delete(habits).where(and(eq(habits.id, id), eq(habits.userId, user.id))).run();
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Sets or clears a completion for a date. Returns the resulting state. */
export async function setHabitLog(habitId: string, date: string, done: boolean, note?: string): Promise<ActionResult<{ done: boolean }>> {
  const user = await requireUser();
  if (!isValidISODate(date)) return { ok: false, error: "Bad date" };
  const today = todayInTimezone(user.timezone);
  if (date > today) return { ok: false, error: "You can't complete a habit in the future." };
  const db = getDb();
  const habit = db.select({ id: habits.id }).from(habits).where(and(eq(habits.id, habitId), eq(habits.userId, user.id))).get();
  if (!habit) return { ok: false, error: "Habit not found" };
  if (done) {
    db.insert(habitLogs)
      .values({ id: newId(), habitId, userId: user.id, date, status: "done", note: note?.trim() || null })
      .onConflictDoUpdate({ target: [habitLogs.habitId, habitLogs.date], set: { status: "done", ...(note !== undefined ? { note: note.trim() || null } : {}) } })
      .run();
  } else {
    db.delete(habitLogs).where(and(eq(habitLogs.habitId, habitId), eq(habitLogs.date, date))).run();
  }
  revalidatePath("/", "layout");
  return { ok: true, data: { done } };
}

export async function reorderHabits(ids: string[]): Promise<ActionResult> {
  const user = await requireUser();
  const db = getDb();
  db.transaction((tx) => {
    ids.forEach((id, i) => {
      tx.update(habits).set({ sortOrder: i }).where(and(eq(habits.id, id), eq(habits.userId, user.id))).run();
    });
  });
  revalidatePath("/", "layout");
  return { ok: true };
}
