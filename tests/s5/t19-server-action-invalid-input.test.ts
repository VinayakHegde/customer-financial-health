import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formDataBlankAmount,
  formDataInvalidNegative,
  formDataInvalidNonNumeric,
} from "../_fixtures/formData";
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

describe("T19 — Server Action: invalid input", () => {
  let teardownCookie: (() => void) | undefined;

  beforeEach(() => {
    dbState.db = makeDb();
    teardownCookie = withPersonaCookie("jordan");
  });

  afterEach(() => {
    teardownCookie?.();
    teardownCookie = undefined;
    dbState.db?.close();
    dbState.db = null;
  });

  it.each([
    ["negative amount", formDataInvalidNegative],
    ["non-numeric amount", formDataInvalidNonNumeric],
    ["blank amount", formDataBlankAmount],
  ] as const)(
    "returns typed errors for %s without writing to the database or redirecting",
    async (_case, formDataFixture) => {
      const db = dbState.db;
      if (!db) {
        throw new Error("Expected test database to be installed");
      }

      const result = await updateSnapshotAction(null, formDataFixture());

      expect(result.ok).toBe(false);
      if (result.ok) {
        return;
      }
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: expect.stringContaining("amountPence"),
          }),
        ]),
      );
      expect(db.listSnapshots("jordan")).toHaveLength(0);
    },
  );
});
