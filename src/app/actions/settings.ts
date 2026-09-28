"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { apiTokens, sessions, users } from "@/db/schema";
import { createApiToken, hashPassword, requireUser, setSetting, validTimezone, verifyPassword } from "@/lib/auth";
import type { ActionResult } from "./habits";

const prefsSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  theme: z.enum(["system", "dark", "light"]).optional(),
  weekStart: z.union([z.literal(0), z.literal(1)]).optional(),
  units: z.enum(["metric", "imperial"]).optional(),
  timezone: z.string().optional(),
  identityStatement: z.string().trim().max(240).optional().nullable(),
});
export type PrefsInput = z.input<typeof prefsSchema>;

export async function updatePreferences(input: PrefsInput): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = prefsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid settings" };
  const d = parsed.data;
  const set: Partial<typeof users.$inferInsert> = {};
  if (d.name !== undefined) set.name = d.name;
  if (d.theme !== undefined) set.theme = d.theme;
  if (d.weekStart !== undefined) set.weekStart = d.weekStart;
  if (d.units !== undefined) set.units = d.units;
  if (d.identityStatement !== undefined) set.identityStatement = d.identityStatement?.trim() || null;
  if (d.timezone !== undefined) {
    const tz = validTimezone(d.timezone);
    if (!tz) return { ok: false, error: "Unknown timezone" };
    set.timezone = tz;
  }
  getDb().update(users).set(set).where(eq(users.id, user.id)).run();
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setLocation(loc: { name: string; latitude: number; longitude: number; timezone?: string | null } | null): Promise<ActionResult> {
  const user = await requireUser();
  if (loc === null) {
    getDb().update(users).set({ locationName: null, latitude: null, longitude: null }).where(eq(users.id, user.id)).run();
  } else {
    if (!Number.isFinite(loc.latitude) || !Number.isFinite(loc.longitude)) return { ok: false, error: "Bad coordinates" };
    getDb()
      .update(users)
      .set({
        locationName: loc.name.trim().slice(0, 120) || "My location",
        latitude: loc.latitude,
        longitude: loc.longitude,
        ...(loc.timezone && validTimezone(loc.timezone) && user.timezone === "UTC" ? { timezone: loc.timezone } : {}),
      })
      .where(eq(users.id, user.id))
      .run();
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function changePassword(current: string, next: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!(await verifyPassword(current, user.passwordHash))) return { ok: false, error: "Current password is incorrect." };
  if (next.length < 8) return { ok: false, error: "New password must be at least 8 characters." };
  getDb().update(users).set({ passwordHash: await hashPassword(next) }).where(eq(users.id, user.id)).run();
  return { ok: true };
}

export async function createToken(name: string): Promise<ActionResult<{ token: string }>> {
  const user = await requireUser();
  const { token } = createApiToken(user.id, name);
  revalidatePath("/settings");
  return { ok: true, data: { token } };
}

export async function revokeToken(id: string): Promise<ActionResult> {
  const user = await requireUser();
  getDb().delete(apiTokens).where(and(eq(apiTokens.id, id), eq(apiTokens.userId, user.id))).run();
  revalidatePath("/settings");
  return { ok: true };
}

export async function signOutEverywhere(): Promise<ActionResult> {
  const user = await requireUser();
  getDb().delete(sessions).where(eq(sessions.userId, user.id)).run();
  return { ok: true };
}

// ---- Admin ----
export async function setRegistrationOpen(open: boolean): Promise<ActionResult> {
  const user = await requireUser();
  if (user.role !== "admin") return { ok: false, error: "Admins only" };
  setSetting("registration_open", open ? "true" : "false");
  revalidatePath("/settings");
  return { ok: true };
}

export async function deleteUser(id: string): Promise<ActionResult> {
  const user = await requireUser();
  if (user.role !== "admin") return { ok: false, error: "Admins only" };
  if (id === user.id) return { ok: false, error: "You can't delete yourself." };
  getDb().delete(users).where(and(eq(users.id, id), ne(users.id, user.id))).run();
  revalidatePath("/settings");
  return { ok: true };
}

export async function setUserRole(id: string, role: "admin" | "member"): Promise<ActionResult> {
  const user = await requireUser();
  if (user.role !== "admin") return { ok: false, error: "Admins only" };
  if (id === user.id) return { ok: false, error: "You can't change your own role." };
  getDb().update(users).set({ role }).where(eq(users.id, id)).run();
  revalidatePath("/settings");
  return { ok: true };
}

export async function deleteAccount(password: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!(await verifyPassword(password, user.passwordHash))) return { ok: false, error: "Password is incorrect." };
  getDb().delete(users).where(eq(users.id, user.id)).run();
  return { ok: true };
}
