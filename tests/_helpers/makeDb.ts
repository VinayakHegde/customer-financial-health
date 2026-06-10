import Database from "better-sqlite3";
import {
  type BetterSQLite3Database,
  drizzle,
} from "drizzle-orm/better-sqlite3";
import { applyMigrations } from "../../lib/db/migrate";
import {
  createSnapshotRepository,
  type SnapshotRepository,
} from "../../lib/db/snapshots";

export type TestDb = SnapshotRepository & {
  db: BetterSQLite3Database;
  close: () => void;
};

/**
 * Opens a fresh in-memory SQLite database, applies Drizzle migrations,
 * and returns a typed snapshot repository for integration tests.
 */
export function makeDb(): TestDb {
  const sqlite = new Database(":memory:");
  const db = drizzle(sqlite);
  applyMigrations(db, ":memory:");
  const repository = createSnapshotRepository(db);

  return {
    db,
    close: () => sqlite.close(),
    ...repository,
  };
}
