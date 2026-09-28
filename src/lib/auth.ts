import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { and, eq, gt, sql } from "drizzle-orm";
import { createHash } from "node:crypto";
import { getDb } from "@/db";
import { apiTokens, appSettings, sessions, users, type User } from "@/db/schema";
import { newId, randomToken } from "./ids";

export const SESSION_COOKIE = "hs_session";
const SESSION_DAYS = 30;

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 12);
}
export async function verifyPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash);
}

export function cookieSecure(): boolean {
  const v = process.env.COOKIE_SECURE;
  if (v === "true") return true;
  if (v === "false") return false;
  return (process.env.APP_URL ?? "").startsWith("https://");
}

export async function createSession(userId: string): Promise<void> {
  const db = getDb();
  const id = randomToken(32);
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  db.insert(sessions).values({ id, userId, expiresAt: expires.toISOString() }).run();
  const jar = await cookies();
  jar.set(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(),
    path: "/",
    expires,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (id) {
    getDb().delete(sessions).where(eq(sessions.id, id)).run();
  }
  jar.delete(SESSION_COOKIE);
}

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (!id) return null;
  const db = getDb();
  const row = db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, id), gt(sessions.expiresAt, new Date().toISOString())))
    .get();
  return row?.user ?? null;
});

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export function userCount(): number {
  const row = getDb().select({ n: sql<number>`count(*)` }).from(users).get();
  return row?.n ?? 0;
}

export function getSetting(key: string): string | null {
  return getDb().select().from(appSettings).where(eq(appSettings.key, key)).get()?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  getDb()
    .insert(appSettings)
    .values({ key, value })
    .onConflictDoUpdate({ target: appSettings.key, set: { value } })
    .run();
}

export function registrationOpen(): boolean {
  if (userCount() === 0) return true;
  if (process.env.ALLOW_REGISTRATION === "false") return false;
  const v = getSetting("registration_open");
  return v === null ? true : v === "true";
}

export async function registerUser(input: {
  email: string;
  name: string;
  password: string;
  timezone?: string;
}): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
  const db = getDb();
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Enter a valid email address." };
  if (input.password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };
  if (!input.name.trim()) return { ok: false, error: "Tell us what to call you." };
  if (!registrationOpen()) return { ok: false, error: "Registration is closed on this instance." };
  const existing = db.select({ id: users.id }).from(users).where(eq(users.email, email)).get();
  if (existing) return { ok: false, error: "An account with that email already exists." };
  const first = userCount() === 0;
  const user: User = {
    id: newId(),
    email,
    name: input.name.trim(),
    passwordHash: await hashPassword(input.password),
    role: first ? "admin" : "member",
    timezone: validTimezone(input.timezone) ?? "UTC",
    theme: "system",
    weekStart: 1,
    units: "metric",
    locationName: null,
    latitude: null,
    longitude: null,
    identityStatement: null,
    createdAt: new Date().toISOString(),
  };
  db.insert(users).values(user).run();
  return { ok: true, user };
}

export function validTimezone(tz?: string | null): string | null {
  if (!tz) return null;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return tz;
  } catch {
    return null;
  }
}

export async function authenticate(email: string, password: string): Promise<User | null> {
  const user = getDb().select().from(users).where(eq(users.email, email.trim().toLowerCase())).get();
  if (!user) {
    // Constant-ish time: still hash to avoid trivially leaking existence.
    await bcrypt.compare(password, "$2a$12$CwTycUXWue0Thq9StjUM0uJ8b4mUGm3Zx0uu5Dh0DlGCm6qUrPaDW");
    return null;
  }
  return (await verifyPassword(password, user.passwordHash)) ? user : null;
}

// ---- Personal API tokens -------------------------------------------------

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createApiToken(userId: string, name: string): { token: string; id: string } {
  const raw = `hs_${randomToken(24)}`;
  const id = newId();
  getDb()
    .insert(apiTokens)
    .values({ id, userId, name: name.trim() || "Token", prefix: raw.slice(0, 10), tokenHash: hashToken(raw) })
    .run();
  return { token: raw, id };
}

export function userFromBearer(header: string | null): User | null {
  if (!header?.startsWith("Bearer ")) return null;
  const raw = header.slice(7).trim();
  if (!raw) return null;
  const db = getDb();
  const row = db
    .select({ user: users, tokenId: apiTokens.id })
    .from(apiTokens)
    .innerJoin(users, eq(apiTokens.userId, users.id))
    .where(eq(apiTokens.tokenHash, hashToken(raw)))
    .get();
  if (!row) return null;
  db.update(apiTokens).set({ lastUsedAt: new Date().toISOString() }).where(eq(apiTokens.id, row.tokenId)).run();
  return row.user;
}

/** Resolve the user for a route handler: cookie session first, then bearer token. */
export async function resolveApiUser(req: Request): Promise<User | null> {
  const bearer = userFromBearer(req.headers.get("authorization"));
  if (bearer) return bearer;
  return getCurrentUser();
}
