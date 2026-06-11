import { sql } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

const personaError = {
  ok: false,
  errors: [{ field: "_", message: "Please pick a persona first." }],
};

describe("T58 — S11: persona validation — three sub-cases", () => {
  let consoleSpies: ReturnType<typeof vi.spyOn>[];
  let teardownCookie: (() => void) | undefined;

  beforeEach(() => {
    dbState.db = makeDb();
    consoleSpies = consoleMethods.map((method) =>
      vi.spyOn(console, method).mockImplementation(() => {}),
    );
  });

  afterEach(() => {
    teardownCookie?.();
    teardownCookie = undefined;
    dbState.db?.close();
    dbState.db = null;
    vi.restoreAllMocks();
  });

  it("(a) cookie absent — typed _ error; no share_links row; cookie value not logged", async () => {
    const formData = new FormData();
    formData.set("snapshotId", "any");
    const result = await createShareLinkAction(null, formData);
    expect(result).toEqual(personaError);

    const db = dbState.db;
    if (!db) throw new Error("expected db");
    const rows = db.db.all(sql`SELECT * FROM share_links`) as unknown[];
    expect(rows).toHaveLength(0);
  });

  it("(b) cookie present, empty string — typed _ error; no share_links row", async () => {
    teardownCookie = withPersonaCookie("");
    const formData = new FormData();
    formData.set("snapshotId", "any");
    const result = await createShareLinkAction(null, formData);
    expect(result).toEqual(personaError);

    const db = dbState.db;
    if (!db) throw new Error("expected db");
    const rows = db.db.all(sql`SELECT * FROM share_links`) as unknown[];
    expect(rows).toHaveLength(0);

    const logged = consoleSpies
      .flatMap((spy) => spy.mock.calls)
      .flat()
      .filter((arg: unknown): arg is string => typeof arg === "string")
      .join("\n");
    expect(logged).not.toContain('""');
  });

  it("(c) cookie present, not a persona id — typed _ error; no share_links row; value not logged", async () => {
    const fakeId = "does-not-exist";
    teardownCookie = withPersonaCookie(fakeId);
    const formData = new FormData();
    formData.set("snapshotId", "any");
    const result = await createShareLinkAction(null, formData);
    expect(result).toEqual(personaError);

    const db = dbState.db;
    if (!db) throw new Error("expected db");
    const rows = db.db.all(sql`SELECT * FROM share_links`) as unknown[];
    expect(rows).toHaveLength(0);

    const logged = consoleSpies
      .flatMap((spy) => spy.mock.calls)
      .flat()
      .filter((arg: unknown): arg is string => typeof arg === "string")
      .join("\n");
    expect(logged).not.toContain(fakeId);
  });
});
