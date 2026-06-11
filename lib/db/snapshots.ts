import { randomUUID } from "node:crypto";
import { desc, eq, sql } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { assess } from "../affordability/calculator";
import type {
  AffordabilityOutcome,
  Band,
  CountryCode,
  Currency,
  IncomeAndExpenditure,
  OutcomeState,
  Snapshot,
} from "../affordability/types";
import { snapshots } from "./schema";

export type CreateSnapshotInput = {
  customerId: string;
  ie: IncomeAndExpenditure;
  outcome: AffordabilityOutcome;
  currency?: Currency;
  countryCode?: CountryCode;
};

const DEFAULT_CURRENCY: Currency = "GBP";
const DEFAULT_COUNTRY_CODE: CountryCode = "GB";

export type SnapshotRepository = {
  createSnapshot: (input: CreateSnapshotInput) => Snapshot;
  listSnapshots: (customerId: string) => Snapshot[];
  getLatestSnapshot: (customerId: string) => Snapshot | null;
  getSnapshotById: (id: string) => Snapshot | null;
};

function rowToSnapshot(row: typeof snapshots.$inferSelect): Snapshot {
  const ie = JSON.parse(row.ieJson) as IncomeAndExpenditure;
  const assessed = assess(ie);

  return {
    id: row.id,
    customerId: row.customerId,
    takenAt: row.takenAt,
    currency: row.currency as Currency,
    countryCode: row.countryCode as CountryCode,
    ie,
    outcome: {
      ...assessed,
      state: row.outcomeState as OutcomeState,
      band: (row.band as Band | null) ?? null,
      totalIncomePence: row.incomePence,
      totalExpenditurePence: row.expenditurePence,
      disposableIncomePence: row.disposablePence,
    },
  };
}

export function createSnapshotRepository(
  db: BetterSQLite3Database,
): SnapshotRepository {
  return {
    createSnapshot(input: CreateSnapshotInput): Snapshot {
      const id = randomUUID();
      const takenAt = new Date().toISOString();
      const { customerId, ie, outcome } = input;
      const currency = input.currency ?? DEFAULT_CURRENCY;
      const countryCode = input.countryCode ?? DEFAULT_COUNTRY_CODE;

      db.insert(snapshots)
        .values({
          id,
          customerId,
          takenAt,
          ieJson: JSON.stringify(ie),
          outcomeState: outcome.state,
          band: outcome.band,
          incomePence: outcome.totalIncomePence,
          expenditurePence: outcome.totalExpenditurePence,
          disposablePence: outcome.disposableIncomePence,
          currency,
          countryCode,
        })
        .run();

      return {
        id,
        customerId,
        takenAt,
        currency,
        countryCode,
        ie,
        outcome,
      };
    },

    listSnapshots(customerId: string): Snapshot[] {
      const rows = db
        .select()
        .from(snapshots)
        .where(eq(snapshots.customerId, customerId))
        .orderBy(desc(snapshots.takenAt), desc(sql`rowid`))
        .all();

      return rows.map(rowToSnapshot);
    },

    getLatestSnapshot(customerId: string): Snapshot | null {
      const row = db
        .select()
        .from(snapshots)
        .where(eq(snapshots.customerId, customerId))
        .orderBy(desc(snapshots.takenAt), desc(sql`rowid`))
        .limit(1)
        .get();

      return row ? rowToSnapshot(row) : null;
    },

    getSnapshotById(id: string): Snapshot | null {
      const row = db
        .select()
        .from(snapshots)
        .where(eq(snapshots.id, id))
        .limit(1)
        .get();
      return row ? rowToSnapshot(row) : null;
    },
  };
}
