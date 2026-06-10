import Database from "better-sqlite3";
import {
  type BetterSQLite3Database,
  drizzle,
} from "drizzle-orm/better-sqlite3";

const SNAPSHOTS_DDL = `
CREATE TABLE snapshots (
  id                TEXT PRIMARY KEY,
  customer_id       TEXT NOT NULL,
  taken_at          TEXT NOT NULL,
  ie_json           TEXT NOT NULL,
  outcome_state     TEXT NOT NULL,
  band              TEXT,
  income_pence      INTEGER NOT NULL,
  expenditure_pence INTEGER NOT NULL,
  disposable_pence  INTEGER NOT NULL
);
CREATE INDEX idx_snapshots_customer_taken
  ON snapshots (customer_id, taken_at DESC);
`;

export type TestDb = {
  db: BetterSQLite3Database;
  close: () => void;
};

/**
 * Opens a fresh in-memory SQLite database, applies the snapshots schema,
 * and returns a Drizzle handle. S2 will wire this to the production repository.
 */
export function makeDb(): TestDb {
  const sqlite = new Database(":memory:");
  sqlite.exec(SNAPSHOTS_DDL);
  const db = drizzle(sqlite);
  return {
    db,
    close: () => sqlite.close(),
  };
}
