import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formDataValidJordan } from "../_fixtures/formData";
import { ieJordanShortfall } from "../_fixtures/ie";
import { makeDb, type TestDb } from "../_helpers/makeDb";
import { withPersonaCookie } from "../_helpers/withPersonaCookie";

const dbState = vi.hoisted(() => ({ db: null as TestDb | null }));

const redirectMock = vi.hoisted(() =>
  vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
);
const revalidatePathMock = vi.hoisted(() => vi.fn());

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
  redirect: (path: string) => redirectMock(path),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (path: string) => revalidatePathMock(path),
}));

import { updateSnapshotAction } from "../../src/app/(main)/dashboard/update/actions";

describe("T18 — Server Action: happy path", () => {
  let teardownCookie: (() => void) | undefined;

  beforeEach(() => {
    dbState.db = makeDb();
    teardownCookie = withPersonaCookie("jordan");
    redirectMock.mockClear();
    revalidatePathMock.mockClear();
  });

  afterEach(() => {
    teardownCookie?.();
    teardownCookie = undefined;
    dbState.db?.close();
    dbState.db = null;
  });

  it("creates a snapshot, revalidates paths, and redirects to /dashboard", async () => {
    const db = dbState.db;
    if (!db) {
      throw new Error("Expected test database to be installed");
    }

    await expect(
      updateSnapshotAction(null, formDataValidJordan()),
    ).rejects.toThrow("REDIRECT:/dashboard");

    const snapshots = db.listSnapshots("jordan");
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]?.ie).toEqual(ieJordanShortfall);

    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
    expect(revalidatePathMock).toHaveBeenCalledWith("/history");
    expect(redirectMock).toHaveBeenCalledWith("/dashboard");
  });
});
