import { sql } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { assess } from "../../lib/affordability/calculator";
import { iePatSurplus } from "../_fixtures/ie";
import { nowJustAfterExpiry, pinnedNowUtc } from "../_fixtures/snapshots";
import { makeDb, type TestDb } from "../_helpers/makeDb";
import { withPersonaCookie } from "../_helpers/withPersonaCookie";

const dbState = vi.hoisted(() => ({ db: null as TestDb | null }));

vi.mock("../../lib/db/client", () => ({
  createSnapshot: (
    input: Parameters<NonNullable<typeof dbState.db>["createSnapshot"]>[0],
  ) => dbState.db?.createSnapshot(input),
  listSnapshots: (customerId: string) =>
    dbState.db?.listSnapshots(customerId) ?? [],
  getLatestSnapshot: (customerId: string) =>
    dbState.db?.getLatestSnapshot(customerId) ?? null,
  getSnapshotById: (id: string) => dbState.db?.getSnapshotById(id) ?? null,
  createShareLink: (
    input: Parameters<NonNullable<typeof dbState.db>["createShareLink"]>[0],
  ) => dbState.db?.createShareLink(input),
  getShareLinkByTokenHash: (hash: string, now: Date) =>
    dbState.db?.getShareLinkByTokenHash(hash, now) ?? null,
}));

import { resolveShare } from "../../lib/share/resolve";
import { createShareLinkAction } from "../../src/app/(main)/dashboard/share/actions";

describe("T60 — S11: resolveShare — all three miss arms collapse to null", () => {
  let teardownCookie: (() => void) | undefined;

  beforeEach(() => {
    dbState.db = makeDb();
    teardownCookie = withPersonaCookie("jordan");
    vi.useFakeTimers();
    vi.setSystemTime(pinnedNowUtc);
  });

  afterEach(() => {
    teardownCookie?.();
    teardownCookie = undefined;
    dbState.db?.close();
    dbState.db = null;
    vi.useRealTimers();
  });

  it("(a) unknown token, (b) expired token, and (c) snapshot row missing all return strictly null", async () => {
    const db = dbState.db;
    if (!db) throw new Error("expected db");

    const snap = db.createSnapshot({
      customerId: "jordan",
      ie: iePatSurplus,
      outcome: assess(iePatSurplus),
    });

    const form = new FormData();
    form.set("snapshotId", snap.id);
    const minted = await createShareLinkAction(null, form);
    if (!minted.ok) throw new Error("expected mint to succeed");
    const rawToken = minted.url.replace(/^\/share\//, "");

    const unknownArm = await resolveShare(
      "garbage-token-that-was-never-minted",
      pinnedNowUtc,
    );
    expect(unknownArm).toBeNull();

    const expiredArm = await resolveShare(rawToken, nowJustAfterExpiry);
    expect(expiredArm).toBeNull();

    db.db.run(sql`PRAGMA foreign_keys = OFF`);
    db.db.run(sql`DELETE FROM snapshots WHERE id = ${snap.id}`);
    db.db.run(sql`PRAGMA foreign_keys = ON`);
    const snapshotRowMissingArm = await resolveShare(rawToken, pinnedNowUtc);
    expect(snapshotRowMissingArm).toBeNull();

    expect(unknownArm).toBe(null);
    expect(expiredArm).toBe(null);
    expect(snapshotRowMissingArm).toBe(null);
  });
});
