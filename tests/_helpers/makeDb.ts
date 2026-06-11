import Database from "better-sqlite3";
import {
  type BetterSQLite3Database,
  drizzle,
} from "drizzle-orm/better-sqlite3";
import { applyMigrations } from "../../lib/db/migrate";
import {
  createShareLinkRepository,
  type ShareLinkRepository,
} from "../../lib/db/share-links";
import {
  createSnapshotRepository,
  type SnapshotRepository,
} from "../../lib/db/snapshots";

export type TestDb = SnapshotRepository &
  ShareLinkRepository & {
    db: BetterSQLite3Database;
    close: () => void;
  };

/**
 * Opens a fresh in-memory SQLite database, applies Drizzle migrations,
 * and returns a typed snapshot + share-links repository for integration tests.
 */
export function makeDb(): TestDb {
  const sqlite = new Database(":memory:");
  const db = drizzle(sqlite);
  applyMigrations(db, ":memory:");
  const snapshots = createSnapshotRepository(db);
  const shareLinks = createShareLinkRepository(db);

  return {
    db,
    close: () => sqlite.close(),
    ...snapshots,
    ...shareLinks,
  };
}
