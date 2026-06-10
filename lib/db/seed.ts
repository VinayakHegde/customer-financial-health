import { count } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { assess } from "../affordability/calculator";
import { getPersonasForSeeding } from "../personas";
import { snapshots } from "./schema";
import type { SnapshotRepository } from "./snapshots";

export function seedStartingSnapshotsIfEmpty(
  db: BetterSQLite3Database,
  snapshotRepository: SnapshotRepository,
): void {
  const [{ value: rowCount }] = db
    .select({ value: count() })
    .from(snapshots)
    .all();
  if (rowCount > 0) {
    return;
  }

  for (const persona of getPersonasForSeeding()) {
    const outcome = assess(persona.startingIe);
    snapshotRepository.createSnapshot({
      customerId: persona.id,
      ie: persona.startingIe,
      outcome,
    });
  }
}
