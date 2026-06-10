import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { applyMigrations } from "./migrate";
import { seedStartingSnapshotsIfEmpty } from "./seed";
import { createSnapshotRepository, type SnapshotRepository } from "./snapshots";

const DB_PATH = `${process.cwd()}/.data/financial-health.sqlite`;

let repository: SnapshotRepository | null = null;

export function getSnapshotRepository(): SnapshotRepository {
  if (repository) {
    return repository;
  }

  const sqlite = new Database(DB_PATH);
  const db = drizzle(sqlite);
  applyMigrations(db, DB_PATH);
  repository = createSnapshotRepository(db);
  seedStartingSnapshotsIfEmpty(db, repository);
  return repository;
}

export const createSnapshot = (
  input: Parameters<SnapshotRepository["createSnapshot"]>[0],
) => getSnapshotRepository().createSnapshot(input);

export const listSnapshots = (customerId: string) =>
  getSnapshotRepository().listSnapshots(customerId);

export const getLatestSnapshot = (customerId: string) =>
  getSnapshotRepository().getLatestSnapshot(customerId);
