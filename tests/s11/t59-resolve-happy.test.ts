import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { assess } from "../../lib/affordability/calculator";
import { iePatSurplus } from "../_fixtures/ie";
import { pinnedNowUtc } from "../_fixtures/snapshots";
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

describe("T59 — S11: resolveShare happy path", () => {
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

  it("returns the linked snapshot when called with a freshly-minted token within the validity window", async () => {
    const db = dbState.db;
    if (!db) throw new Error("expected db");

    const snap = db.createSnapshot({
      customerId: "jordan",
      ie: iePatSurplus,
      outcome: assess(iePatSurplus),
    });

    const formData = new FormData();
    formData.set("snapshotId", snap.id);
    const minted = await createShareLinkAction(null, formData);
    if (!minted.ok) throw new Error("expected mint to succeed");
    const rawToken = minted.url.replace(/^\/share\//, "");

    const resolved = await resolveShare(rawToken, pinnedNowUtc);
    expect(resolved).not.toBeNull();
    expect(resolved?.id).toBe(snap.id);
    expect(resolved?.customerId).toBe("jordan");
  });
});
