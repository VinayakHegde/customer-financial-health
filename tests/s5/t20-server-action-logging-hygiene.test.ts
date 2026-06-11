import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formDataValidJordan } from "../_fixtures/formData";
import { makeDb, type TestDb } from "../_helpers/makeDb";
import { withPersonaCookie } from "../_helpers/withPersonaCookie";

const dbState = vi.hoisted(() => ({ db: null as TestDb | null }));

const redirectMock = vi.hoisted(() =>
  vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
);

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
  revalidatePath: vi.fn(),
}));

import { updateSnapshotAction } from "../../src/app/(main)/dashboard/update/actions";

const consoleMethods = ["log", "info", "debug", "warn", "error"] as const;

describe("T20 — Server Action: logging hygiene", () => {
  let teardownCookie: (() => void) | undefined;
  let consoleSpies: ReturnType<typeof vi.spyOn>[];

  beforeEach(() => {
    dbState.db = makeDb();
    teardownCookie = withPersonaCookie("jordan");
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

  it("does not log I&E amounts, persona ids, or earner/expenditure labels", async () => {
    await expect(
      updateSnapshotAction(null, formDataValidJordan()),
    ).rejects.toThrow("REDIRECT:/dashboard");

    const logged = consoleSpies
      .flatMap((spy) => spy.mock.calls)
      .flat()
      .filter((arg: unknown): arg is string => typeof arg === "string")
      .join("\n");

    const forbidden = [
      "165000",
      "1650.00",
      "105000",
      "1050.00",
      "jordan",
      "Jordan",
      "Rent",
      "Loan",
      "Food",
      "Travel",
      "Utilities",
    ];

    for (const token of forbidden) {
      expect(logged.toLowerCase()).not.toContain(token.toLowerCase());
    }
  });
});
