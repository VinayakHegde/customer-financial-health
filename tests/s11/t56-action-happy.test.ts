import { sql } from "drizzle-orm";
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

import { createShareLinkAction } from "../../src/app/(main)/dashboard/share/actions";

describe("T56 — S11: createShareLinkAction happy path", () => {
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

  it("returns ok with /share/<token> URL, expiresAt = pinned + 24h, and persists only the hash", async () => {
    const db = dbState.db;
    if (!db) throw new Error("expected db");

    const snap = db.createSnapshot({
      customerId: "jordan",
      ie: iePatSurplus,
      outcome: assess(iePatSurplus),
    });

    const formData = new FormData();
    formData.set("snapshotId", snap.id);
    const result = await createShareLinkAction(null, formData);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.url).toMatch(/^\/share\/[A-Za-z0-9_-]{43}$/);
    const expectedExpiry = new Date(
      pinnedNowUtc.getTime() + 24 * 60 * 60 * 1000,
    );
    expect(new Date(result.expiresAt).getTime()).toBe(expectedExpiry.getTime());

    const allRows = db.db.all(sql`SELECT * FROM share_links`) as Record<
      string,
      string
    >[];
    expect(allRows).toHaveLength(1);

    const rawToken = result.url.replace(/^\/share\//, "");
    for (const row of allRows) {
      for (const value of Object.values(row)) {
        if (typeof value === "string") {
          expect(value).not.toContain(rawToken);
        }
      }
    }
  });
});
