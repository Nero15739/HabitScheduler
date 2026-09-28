import "server-only";
import { and, asc, desc, eq, gte, inArray, isNull, lte } from "drizzle-orm";
import { getDb } from "@/db";
import { goalMilestones, goals, habitLogs, habits, mindsetLogs, tasks, type Goal, type GoalMilestone } from "@/db/schema";
import type { ISODate } from "./dates";

export function listHabits(userId: string, opts: { includeArchived?: boolean } = {}) {
  const db = getDb();
  const where = opts.includeArchived
    ? eq(habits.userId, userId)
    : and(eq(habits.userId, userId), isNull(habits.archivedAt));
  return db.select().from(habits).where(where).orderBy(asc(habits.sortOrder), asc(habits.createdAt)).all();
}

export function getHabit(userId: string, id: string) {
  return getDb().select().from(habits).where(and(eq(habits.id, id), eq(habits.userId, userId))).get() ?? null;
}

export function logsInRange(userId: string, from: ISODate, to: ISODate, habitIds?: string[]) {
  const db = getDb();
  const conds = [eq(habitLogs.userId, userId), gte(habitLogs.date, from), lte(habitLogs.date, to)];
  if (habitIds && habitIds.length) conds.push(inArray(habitLogs.habitId, habitIds));
  return db.select().from(habitLogs).where(and(...conds)).all();
}

export function allLogs(userId: string) {
  return getDb().select().from(habitLogs).where(eq(habitLogs.userId, userId)).all();
}

export function tasksInRange(userId: string, from: ISODate, to: ISODate) {
  return getDb()
    .select()
    .from(tasks)
    .where(and(eq(tasks.userId, userId), gte(tasks.date, from), lte(tasks.date, to)))
    .orderBy(asc(tasks.date), asc(tasks.sortOrder), asc(tasks.createdAt))
    .all();
}

export function mindsetInRange(userId: string, from: ISODate, to: ISODate) {
  return getDb()
    .select()
    .from(mindsetLogs)
    .where(and(eq(mindsetLogs.userId, userId), gte(mindsetLogs.date, from), lte(mindsetLogs.date, to)))
    .orderBy(asc(mindsetLogs.date))
    .all();
}

export type GoalWithMilestones = Goal & { milestones: GoalMilestone[] };

export function listGoals(userId: string, opts: { includeArchived?: boolean } = {}): GoalWithMilestones[] {
  const db = getDb();
  const rows = db
    .select()
    .from(goals)
    .where(eq(goals.userId, userId))
    .orderBy(asc(goals.sortOrder), desc(goals.createdAt))
    .all()
    .filter((g) => opts.includeArchived || g.status !== "archived");
  if (!rows.length) return [];
  const ms = db
    .select()
    .from(goalMilestones)
    .where(inArray(goalMilestones.goalId, rows.map((g) => g.id)))
    .orderBy(asc(goalMilestones.sortOrder), asc(goalMilestones.createdAt))
    .all();
  return rows.map((g) => ({ ...g, milestones: ms.filter((m) => m.goalId === g.id) }));
}

export function parseHabitIds(goal: Pick<Goal, "habitIds">): string[] {
  try {
    const arr = JSON.parse(goal.habitIds);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}
