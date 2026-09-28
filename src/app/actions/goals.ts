"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { goalMilestones, goals } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { isValidISODate } from "@/lib/dates";
import { newId } from "@/lib/ids";
import { COLOR_KEYS } from "@/lib/colors";
import type { ActionResult } from "./habits";

const goalSchema = z.object({
  title: z.string().trim().min(1, "Give the goal a title.").max(160),
  description: z.string().trim().max(2000).optional().nullable(),
  identity: z.string().trim().max(200).optional().nullable(),
  color: z.string().refine((c) => COLOR_KEYS.includes(c)).default("mint"),
  targetDate: z.string().refine((d) => !d || isValidISODate(d)).optional().nullable(),
  habitIds: z.array(z.string()).default([]),
  progress: z.number().int().min(0).max(100).default(0),
  milestones: z.array(z.string().trim().min(1).max(160)).default([]),
});
export type GoalInput = z.input<typeof goalSchema>;

export async function createGoal(input: GoalInput): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = goalSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid goal" };
  const d = parsed.data;
  const db = getDb();
  const id = newId();
  const max = db.select({ m: sql<number>`coalesce(max(${goals.sortOrder}), -1)` }).from(goals).where(eq(goals.userId, user.id)).get();
  db.transaction((tx) => {
    tx.insert(goals)
      .values({
        id,
        userId: user.id,
        title: d.title,
        description: d.description?.trim() || null,
        identity: d.identity?.trim() || null,
        color: d.color,
        targetDate: d.targetDate || null,
        habitIds: JSON.stringify(d.habitIds),
        progress: d.progress,
        sortOrder: (max?.m ?? -1) + 1,
      })
      .run();
    d.milestones.forEach((title, i) => {
      tx.insert(goalMilestones).values({ id: newId(), goalId: id, title, sortOrder: i }).run();
    });
  });
  revalidatePath("/", "layout");
  return { ok: true, data: { id } };
}

export async function updateGoal(id: string, input: GoalInput): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = goalSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid goal" };
  const d = parsed.data;
  const db = getDb();
  const existing = db.select({ id: goals.id }).from(goals).where(and(eq(goals.id, id), eq(goals.userId, user.id))).get();
  if (!existing) return { ok: false, error: "Goal not found" };
  db.transaction((tx) => {
    tx.update(goals)
      .set({
        title: d.title,
        description: d.description?.trim() || null,
        identity: d.identity?.trim() || null,
        color: d.color,
        targetDate: d.targetDate || null,
        habitIds: JSON.stringify(d.habitIds),
        progress: d.progress,
      })
      .where(eq(goals.id, id))
      .run();
    // Milestones passed here are *new* ones to append; existing ones are managed individually.
    const max = tx.select({ m: sql<number>`coalesce(max(${goalMilestones.sortOrder}), -1)` }).from(goalMilestones).where(eq(goalMilestones.goalId, id)).get();
    d.milestones.forEach((title, i) => {
      tx.insert(goalMilestones).values({ id: newId(), goalId: id, title, sortOrder: (max?.m ?? -1) + 1 + i }).run();
    });
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setGoalProgress(id: string, progress: number): Promise<ActionResult> {
  const user = await requireUser();
  const p = Math.max(0, Math.min(100, Math.round(progress)));
  getDb()
    .update(goals)
    .set({ progress: p, ...(p === 100 ? { status: "completed", completedAt: new Date().toISOString() } : { status: "active", completedAt: null }) })
    .where(and(eq(goals.id, id), eq(goals.userId, user.id)))
    .run();
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setGoalStatus(id: string, status: "active" | "completed" | "archived"): Promise<ActionResult> {
  const user = await requireUser();
  getDb()
    .update(goals)
    .set({
      status,
      completedAt: status === "completed" ? new Date().toISOString() : null,
      ...(status === "completed" ? { progress: 100 } : {}),
    })
    .where(and(eq(goals.id, id), eq(goals.userId, user.id)))
    .run();
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteGoal(id: string): Promise<ActionResult> {
  const user = await requireUser();
  getDb().delete(goals).where(and(eq(goals.id, id), eq(goals.userId, user.id))).run();
  revalidatePath("/", "layout");
  return { ok: true };
}

async function ownsGoal(userId: string, goalId: string): Promise<boolean> {
  return !!getDb().select({ id: goals.id }).from(goals).where(and(eq(goals.id, goalId), eq(goals.userId, userId))).get();
}

export async function addMilestone(goalId: string, title: string): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  if (!(await ownsGoal(user.id, goalId))) return { ok: false, error: "Goal not found" };
  const t = title.trim();
  if (!t) return { ok: false, error: "Milestone needs a title" };
  const db = getDb();
  const max = db.select({ m: sql<number>`coalesce(max(${goalMilestones.sortOrder}), -1)` }).from(goalMilestones).where(eq(goalMilestones.goalId, goalId)).get();
  const id = newId();
  db.insert(goalMilestones).values({ id, goalId, title: t.slice(0, 160), sortOrder: (max?.m ?? -1) + 1 }).run();
  revalidatePath("/", "layout");
  return { ok: true, data: { id } };
}

export async function toggleMilestone(id: string, done: boolean): Promise<ActionResult> {
  const user = await requireUser();
  const db = getDb();
  const row = db
    .select({ goalId: goalMilestones.goalId })
    .from(goalMilestones)
    .innerJoin(goals, eq(goals.id, goalMilestones.goalId))
    .where(and(eq(goalMilestones.id, id), eq(goals.userId, user.id)))
    .get();
  if (!row) return { ok: false, error: "Milestone not found" };
  db.update(goalMilestones).set({ done }).where(eq(goalMilestones.id, id)).run();
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteMilestone(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const db = getDb();
  const row = db
    .select({ id: goalMilestones.id })
    .from(goalMilestones)
    .innerJoin(goals, eq(goals.id, goalMilestones.goalId))
    .where(and(eq(goalMilestones.id, id), eq(goals.userId, user.id)))
    .get();
  if (!row) return { ok: false, error: "Milestone not found" };
  db.delete(goalMilestones).where(eq(goalMilestones.id, id)).run();
  revalidatePath("/", "layout");
  return { ok: true };
}
