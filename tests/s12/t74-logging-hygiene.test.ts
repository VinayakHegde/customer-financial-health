import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatMoney } from "../../lib/affordability/format";
import { snapshotJordanStoredGbp } from "../_fixtures/snapshots";
import { withPersonaCookie } from "../_helpers/withPersonaCookie";

const dbState = vi.hoisted(() => ({
  snapshotsById: new Map<string, unknown>(),
}));

vi.mock("../../lib/db", () => ({
  getSnapshotById: (id: string) => dbState.snapshotsById.get(id) ?? null,
}));

import { GET } from "../../src/app/(main)/dashboard/snapshot/[id]/pdf/route";

const consoleMethods = ["log", "info", "debug", "warn", "error"] as const;

describe("T74 — S12: logging hygiene across one full GET (application-code scope)", () => {
  let teardown: (() => void) | undefined;
  let consoleSpies: ReturnType<typeof vi.spyOn>[];

  beforeEach(() => {
    teardown = withPersonaCookie("jordan");
    dbState.snapshotsById.set(
      snapshotJordanStoredGbp.id,
      snapshotJordanStoredGbp,
    );
    consoleSpies = consoleMethods.map((method) =>
      vi.spyOn(console, method).mockImplementation(() => {}),
    );
  });

  afterEach(() => {
    teardown?.();
    teardown = undefined;
    dbState.snapshotsById.clear();
    vi.restoreAllMocks();
  });

  it("records zero IE-value digits, persona id, snapshot id, or IE labels in application-code logs", async () => {
    const response = await GET(new Request("http://test/pdf"), {
      params: Promise.resolve({ id: snapshotJordanStoredGbp.id }),
    });
    expect(response.status).toBe(200);
    await response.arrayBuffer();

    const logged = consoleSpies
      .flatMap((spy) => spy.mock.calls)
      .flat()
      .filter((arg: unknown): arg is string => typeof arg === "string")
      .join("\n");

    const o = snapshotJordanStoredGbp.outcome;
    const ie = snapshotJordanStoredGbp.ie;
    const { currency, countryCode } = snapshotJordanStoredGbp;
    const forbidden = [
      String(o.totalIncomePence),
      String(o.totalExpenditurePence),
      String(Math.abs(o.disposableIncomePence)),
      // Formatted £ strings — a log line that emitted the customer-visible
      // money string (e.g. "£1,650.00") would slip past a digits-only check
      // because the comma + ".00" break the raw-pence substring.
      formatMoney(o.totalIncomePence, currency, countryCode),
      formatMoney(o.totalExpenditurePence, currency, countryCode),
      formatMoney(Math.abs(o.disposableIncomePence), currency, countryCode),
      "jordan",
      "Jordan",
      snapshotJordanStoredGbp.id,
      ...ie.earners.map((e) => e.label),
      ...ie.expenditure.map((e) => e.label),
    ];

    for (const token of forbidden) {
      if (token.length === 0) continue;
      expect(logged.toLowerCase()).not.toContain(token.toLowerCase());
    }
  }, 20_000);
});
