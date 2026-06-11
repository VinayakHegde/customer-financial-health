import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { applyMigrations } from "./migrate";
import { seedStartingSnapshotsIfEmpty } from "./seed";
import {
  createShareLinkRepository,
  type ShareLinkRepository,
} from "./share-links";
import { createSnapshotRepository, type SnapshotRepository } from "./snapshots";

const DB_PATH = `${process.cwd()}/.data/financial-health.sqlite`;

type Repositories = {
  snapshots: SnapshotRepository;
  shareLinks: ShareLinkRepository;
};

let repositories: Repositories | null = null;

function getRepositories(): Repositories {
  if (repositories) {
    return repositories;
  }

  mkdirSync(dirname(DB_PATH), { recursive: true });
  const sqlite = new Database(DB_PATH);
  const db = drizzle(sqlite);
  applyMigrations(db, DB_PATH);
  const snapshots = createSnapshotRepository(db);
  seedStartingSnapshotsIfEmpty(db, snapshots);
  repositories = {
    snapshots,
    shareLinks: createShareLinkRepository(db),
  };
  return repositories;
}

export function getSnapshotRepository(): SnapshotRepository {
  return getRepositories().snapshots;
}

export function getShareLinkRepository(): ShareLinkRepository {
  return getRepositories().shareLinks;
}

export const createSnapshot = (
  input: Parameters<SnapshotRepository["createSnapshot"]>[0],
) => getSnapshotRepository().createSnapshot(input);

export const listSnapshots = (customerId: string) =>
  getSnapshotRepository().listSnapshots(customerId);

export const getLatestSnapshot = (customerId: string) =>
  getSnapshotRepository().getLatestSnapshot(customerId);

export const getSnapshotById = (id: string) =>
  getSnapshotRepository().getSnapshotById(id);

export const createShareLink = (
  input: Parameters<ShareLinkRepository["createShareLink"]>[0],
) => getShareLinkRepository().createShareLink(input);

export const getShareLinkByTokenHash = (tokenHash: string, now: Date) =>
  getShareLinkRepository().getShareLinkByTokenHash(tokenHash, now);
