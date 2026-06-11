import { sql } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { assess } from "../../lib/affordability/calculator";
import { hashShareToken } from "../../lib/share/token";
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

const consoleMethods = ["log", "info", "debug", "warn", "error"] as const;

describe("T67 — S11: logging hygiene across mint + resolver — application-code scope", () => {
  let consoleSpies: ReturnType<typeof vi.spyOn>[];
  let teardownCookie: (() => void) | undefined;

  beforeEach(() => {
    dbState.db = makeDb();
    teardownCookie = withPersonaCookie("jordan");
    consoleSpies = consoleMethods.map((method) =>
      vi.spyOn(console, method).mockImplementation(() => {}),
    );
    vi.useFakeTimers();
    vi.setSystemTime(pinnedNowUtc);
  });

  afterEach(() => {
    teardownCookie?.();
    teardownCookie = undefined;
    dbState.db?.close();
    dbState.db = null;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("never logs raw token, token hash, snapshot id, IE digit, or IE label across all four paths", async () => {
    const db = dbState.db;
    if (!db) throw new Error("expected db");

    const snap = db.createSnapshot({
      customerId: "jordan",
      ie: iePatSurplus,
      outcome: assess(iePatSurplus),
    });

    const formA = new FormData();
    formA.set("snapshotId", snap.id);
    const minted = await createShareLinkAction(null, formA);
    if (!minted.ok) throw new Error("expected mint to succeed");
    const rawToken = minted.url.replace(/^\/share\//, "");
    const tokenHash = hashShareToken(rawToken);

    await resolveShare(rawToken, nowJustAfterExpiry);

    const garbage = "garbage-value";
    await resolveShare(garbage, pinnedNowUtc);

    db.db.run(sql`PRAGMA foreign_keys = OFF`);
    db.db.run(sql`DELETE FROM snapshots WHERE id = ${snap.id}`);
    db.db.run(sql`PRAGMA foreign_keys = ON`);
    await resolveShare(rawToken, pinnedNowUtc);

    const logged = consoleSpies
      .flatMap((spy) => spy.mock.calls)
      .flat()
      .filter((arg: unknown): arg is string => typeof arg === "string")
      .join("\n");

    expect(logged).not.toContain(rawToken);
    expect(logged).not.toContain(tokenHash);
    expect(logged).not.toContain(hashShareToken(garbage));
    expect(logged).not.toContain(snap.id);

    const totalIncome = String(snap.outcome.totalIncomePence);
    expect(logged).not.toContain(totalIncome);
    const totalOut = String(snap.outcome.totalExpenditurePence);
    expect(logged).not.toContain(totalOut);
    const disposable = String(snap.outcome.disposableIncomePence);
    expect(logged).not.toContain(disposable);

    for (const earner of snap.ie.earners) {
      if (earner.label.length > 1) {
        expect(logged).not.toContain(earner.label);
      }
    }
    for (const line of snap.ie.expenditure) {
      if (line.label.length > 1) {
        expect(logged).not.toContain(line.label);
      }
    }
  });
});
