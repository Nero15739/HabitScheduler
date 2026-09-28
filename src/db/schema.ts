import { sql } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const now = sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`;

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "member"] }).notNull().default("member"),
  timezone: text("timezone").notNull().default("UTC"),
  theme: text("theme", { enum: ["system", "dark", "light"] }).notNull().default("system"),
  weekStart: integer("week_start").notNull().default(1), // 0 = Sunday, 1 = Monday
  units: text("units", { enum: ["metric", "imperial"] }).notNull().default("metric"),
  locationName: text("location_name"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  identityStatement: text("identity_statement"),
  createdAt: text("created_at").notNull().default(now),
});

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at").notNull().default(now),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const habits = sqliteTable(
  "habits",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    emoji: text("emoji"),
    color: text("color").notNull().default("mint"),
    kind: text("kind", { enum: ["build", "break"] }).notNull().default("build"),
    frequency: text("frequency", { enum: ["daily", "weekly", "monthly"] }).notNull().default("daily"),
    /** JSON array of weekday numbers (0=Sun..6=Sat) the habit is scheduled on. Daily habits only. */
    daysOfWeek: text("days_of_week").notNull().default("[0,1,2,3,4,5,6]"),
    /** How many completions count as a full period for weekly/monthly habits. */
    timesPerPeriod: integer("times_per_period").notNull().default(1),
    // Atomic Habits fields
    identity: text("identity"),
    cueTime: text("cue_time"),
    cueLocation: text("cue_location"),
    stackAfter: text("stack_after"),
    twoMinuteVersion: text("two_minute_version"),
    reward: text("reward"),
    notes: text("notes"),
    startDate: text("start_date").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    archivedAt: text("archived_at"),
    createdAt: text("created_at").notNull().default(now),
  },
  (t) => [index("habits_user_idx").on(t.userId)],
);

export const habitLogs = sqliteTable(
  "habit_logs",
  {
    id: text("id").primaryKey(),
    habitId: text("habit_id").notNull().references(() => habits.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    date: text("date").notNull(), // YYYY-MM-DD in the user's timezone
    status: text("status", { enum: ["done", "skipped"] }).notNull().default("done"),
    note: text("note"),
    createdAt: text("created_at").notNull().default(now),
  },
  (t) => [
    uniqueIndex("habit_logs_habit_date_uq").on(t.habitId, t.date),
    index("habit_logs_user_date_idx").on(t.userId, t.date),
  ],
);

export const tasks = sqliteTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    date: text("date").notNull(),
    done: integer("done", { mode: "boolean" }).notNull().default(false),
    doneAt: text("done_at"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: text("created_at").notNull().default(now),
  },
  (t) => [index("tasks_user_date_idx").on(t.userId, t.date)],
);

export const mindsetLogs = sqliteTable(
  "mindset_logs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    energy: integer("energy"),
    focus: integer("focus"),
    motivation: integer("motivation"),
    note: text("note"),
    createdAt: text("created_at").notNull().default(now),
  },
  (t) => [uniqueIndex("mindset_user_date_uq").on(t.userId, t.date)],
);

export const goals = sqliteTable(
  "goals",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    identity: text("identity"),
    color: text("color").notNull().default("mint"),
    targetDate: text("target_date"),
    status: text("status", { enum: ["active", "completed", "archived"] }).notNull().default("active"),
    progress: integer("progress").notNull().default(0), // 0..100, manual
    /** JSON array of habit ids that feed this goal. */
    habitIds: text("habit_ids").notNull().default("[]"),
    sortOrder: integer("sort_order").notNull().default(0),
    completedAt: text("completed_at"),
    createdAt: text("created_at").notNull().default(now),
  },
  (t) => [index("goals_user_idx").on(t.userId)],
);

export const goalMilestones = sqliteTable(
  "goal_milestones",
  {
    id: text("id").primaryKey(),
    goalId: text("goal_id").notNull().references(() => goals.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    done: integer("done", { mode: "boolean" }).notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: text("created_at").notNull().default(now),
  },
  (t) => [index("milestones_goal_idx").on(t.goalId)],
);

export const apiTokens = sqliteTable(
  "api_tokens",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    prefix: text("prefix").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    lastUsedAt: text("last_used_at"),
    createdAt: text("created_at").notNull().default(now),
  },
  (t) => [index("api_tokens_user_idx").on(t.userId)],
);

export const cacheEntries = sqliteTable("cache_entries", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  expiresAt: text("expires_at").notNull(),
});

export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export type User = typeof users.$inferSelect;
export type Habit = typeof habits.$inferSelect;
export type HabitLog = typeof habitLogs.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type MindsetLog = typeof mindsetLogs.$inferSelect;
export type Goal = typeof goals.$inferSelect;
export type GoalMilestone = typeof goalMilestones.$inferSelect;
export type ApiToken = typeof apiTokens.$inferSelect;
