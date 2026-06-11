import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formDataValidJordan } from "../_fixtures/formData";
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
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { updateSnapshotAction } from "../../src/app/(main)/dashboard/update/actions";

describe("T35 — Server Action: missing or invalid persona cookie", () => {
  let teardownCookie: (() => void) | undefined;

  beforeEach(() => {
    dbState.db = makeDb();
    teardownCookie = withPersonaCookie(null);
  });

  afterEach(() => {
    teardownCookie?.();
    teardownCookie = undefined;
    dbState.db?.close();
    dbState.db = null;
  });

  it.each([
    ["missing", null],
    ["invalid", "bogus"],
  ] as const)(
    "returns a typed error for %s persona without throwing or writing to the database",
    async (_case, personaId) => {
      teardownCookie?.();
      teardownCookie = withPersonaCookie(personaId);

      const db = dbState.db;
      if (!db) {
        throw new Error("Expected test database to be installed");
      }

      const result = await updateSnapshotAction(null, formDataValidJordan());

      expect(result).toEqual({
        ok: false,
        errors: [{ field: "_", message: "Please pick a persona first." }],
      });
      expect(db.listSnapshots("jordan")).toHaveLength(0);
      expect(db.listSnapshots("bogus")).toHaveLength(0);
    },
  );
});
