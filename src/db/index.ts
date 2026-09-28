import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";

export type DB = BetterSQLite3Database<typeof schema>;

declare global {
  var __habitDb: { db: DB; sqlite: Database.Database; migrated: boolean } | undefined;
}

export function databasePath(): string {
  return process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "habits.db");
}

function open(): { db: DB; sqlite: Database.Database } {
  const file = databasePath();
  if (file !== ":memory:") fs.mkdirSync(path.dirname(file), { recursive: true });
  const sqlite = new Database(file);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");
  const db = drizzle(sqlite, { schema });
  return { db, sqlite };
}

function migrationsFolder(): string {
  const candidates = [
    path.join(process.cwd(), "drizzle"),
    path.join(__dirname, "..", "..", "drizzle"),
    path.join(__dirname, "..", "..", "..", "drizzle"),
  ];
  for (const c of candidates) if (fs.existsSync(path.join(c, "meta", "_journal.json"))) return c;
  return candidates[0];
}

export function getDb(): DB {
  if (!globalThis.__habitDb) {
    const opened = open();
    globalThis.__habitDb = { ...opened, migrated: false };
  }
  const entry = globalThis.__habitDb;
  if (!entry.migrated) {
    migrate(entry.db, { migrationsFolder: migrationsFolder() });
    entry.migrated = true;
  }
  return entry.db;
}

export function runMigrations(): void {
  getDb();
}

export { schema };
