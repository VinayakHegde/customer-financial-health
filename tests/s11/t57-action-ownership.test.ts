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

const consoleMethods = ["log", "info", "debug", "warn", "error"] as const;

describe("T57 — S11: cross-persona ownership rejected with no information leak", () => {
  let teardownCookie: (() => void) | undefined;
  let consoleSpies: ReturnType<typeof vi.spyOn>[];

  beforeEach(() => {
    dbState.db = makeDb();
    teardownCookie = withPersonaCookie("jordan");
    vi.useFakeTimers();
    vi.setSystemTime(pinnedNowUtc);
    consoleSpies = consoleMethods.map((method) =>
      vi.spyOn(console, method).mockImplementation(() => {}),
    );
  });

  afterEach(() => {
    teardownCookie?.();
    teardownCookie = undefined;
    dbState.db?.close();
    dbState.db = null;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns the same generic error for cross-persona snapshot and non-existent snapshot, with no DB write or id logged", async () => {
    const db = dbState.db;
    if (!db) throw new Error("expected db");

    const patsSnap = db.createSnapshot({
      customerId: "pat",
      ie: iePatSurplus,
      outcome: assess(iePatSurplus),
    });

    const formCross = new FormData();
    formCross.set("snapshotId", patsSnap.id);
    const cross = await createShareLinkAction(null, formCross);

    const formMissing = new FormData();
    formMissing.set("snapshotId", "00000000-0000-0000-0000-000000000000");
    const missing = await createShareLinkAction(null, formMissing);

    expect(cross.ok).toBe(false);
    expect(missing.ok).toBe(false);
    if (!cross.ok && !missing.ok) {
      expect(cross.errors).toEqual(missing.errors);
      const generic = cross.errors[0];
      expect(generic.field).toBe("_");
      expect(generic.message).toMatch(/share/i);
    }

    const rows = db.db.all(sql`SELECT * FROM share_links`) as unknown[];
    expect(rows).toHaveLength(0);

    const logged = consoleSpies
      .flatMap((spy) => spy.mock.calls)
      .flat()
      .filter((arg: unknown): arg is string => typeof arg === "string")
      .join("\n");
    expect(logged).not.toContain(patsSnap.id);
  });
});
