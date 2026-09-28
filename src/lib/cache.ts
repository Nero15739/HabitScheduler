import { eq, lt } from "drizzle-orm";
import { getDb } from "@/db";
import { cacheEntries } from "@/db/schema";

export function cacheGet<T>(key: string): T | null {
  const row = getDb().select().from(cacheEntries).where(eq(cacheEntries.key, key)).get();
  if (!row) return null;
  if (row.expiresAt < new Date().toISOString()) return null;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return null;
  }
}

export function cacheSet(key: string, value: unknown, ttlSeconds: number): void {
  const db = getDb();
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  db.insert(cacheEntries)
    .values({ key, value: JSON.stringify(value), expiresAt })
    .onConflictDoUpdate({ target: cacheEntries.key, set: { value: JSON.stringify(value), expiresAt } })
    .run();
  // Opportunistic cleanup
  if (Math.random() < 0.05) db.delete(cacheEntries).where(lt(cacheEntries.expiresAt, new Date().toISOString())).run();
}

export async function cached<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
  const hit = cacheGet<T>(key);
  if (hit !== null) return hit;
  const val = await fn();
  cacheSet(key, val, ttlSeconds);
  return val;
}
