"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { mindsetLogs, tasks } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { isValidISODate } from "@/lib/dates";
import { newId } from "@/lib/ids";
import type { ActionResult } from "./habits";

export async function addTask(title: string, date: string): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const t = title.trim();
  if (!t) return { ok: false, error: "Task needs a title" };
  if (!isValidISODate(date)) return { ok: false, error: "Bad date" };
  const db = getDb();
  const max = db
    .select({ m: sql<number>`coalesce(max(${tasks.sortOrder}), -1)` })
    .from(tasks)
    .where(and(eq(tasks.userId, user.id), eq(tasks.date, date)))
    .get();
  const id = newId();
  db.insert(tasks).values({ id, userId: user.id, title: t.slice(0, 200), date, sortOrder: (max?.m ?? -1) + 1 }).run();
  revalidatePath("/", "layout");
  return { ok: true, data: { id } };
}

export async function toggleTask(id: string, done: boolean): Promise<ActionResult> {
  const user = await requireUser();
  getDb()
    .update(tasks)
    .set({ done, doneAt: done ? new Date().toISOString() : null })
    .where(and(eq(tasks.id, id), eq(tasks.userId, user.id)))
    .run();
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateTask(id: string, patch: { title?: string; date?: string }): Promise<ActionResult> {
  const user = await requireUser();
  const set: Partial<{ title: string; date: string }> = {};
  if (patch.title !== undefined) {
    const t = patch.title.trim();
    if (!t) return { ok: false, error: "Task needs a title" };
    set.title = t.slice(0, 200);
  }
  if (patch.date !== undefined) {
    if (!isValidISODate(patch.date)) return { ok: false, error: "Bad date" };
    set.date = patch.date;
  }
  getDb().update(tasks).set(set).where(and(eq(tasks.id, id), eq(tasks.userId, user.id))).run();
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteTask(id: string): Promise<ActionResult> {
  const user = await requireUser();
  getDb().delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, user.id))).run();
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function saveMindset(
  date: string,
  values: { energy?: number | null; focus?: number | null; motivation?: number | null; note?: string | null },
): Promise<ActionResult> {
  const user = await requireUser();
  if (!isValidISODate(date)) return { ok: false, error: "Bad date" };
  const clamp = (v: number | null | undefined) => (v === null || v === undefined ? null : Math.max(1, Math.min(10, Math.round(v))));
  const row = {
    energy: clamp(values.energy),
    focus: clamp(values.focus),
    motivation: clamp(values.motivation),
    note: values.note?.trim() || null,
  };
  getDb()
    .insert(mindsetLogs)
    .values({ id: newId(), userId: user.id, date, ...row })
    .onConflictDoUpdate({ target: [mindsetLogs.userId, mindsetLogs.date], set: row })
    .run();
  revalidatePath("/", "layout");
  return { ok: true };
}
