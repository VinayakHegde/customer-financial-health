import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

const MIGRATIONS_FOLDER = `${process.cwd()}/drizzle`;

export function applyMigrations(
  db: BetterSQLite3Database,
  dbPath: string,
): void {
  console.log("db: opened");
  mkdirSync(dirname(dbPath), { recursive: true });
  migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  console.log("db: migration applied");
}
