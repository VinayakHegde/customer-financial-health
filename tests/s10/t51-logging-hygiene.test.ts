import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { assess } from "../../lib/affordability/calculator";
import { iePatSurplus } from "../_fixtures/ie";
import { makeDb } from "../_helpers";

const consoleMethods = ["log", "info", "debug", "warn", "error"] as const;

const forbiddenSubstrings = ["GBP", "GB", "currency", "country_code"];

describe("T51 — S10: logging hygiene — no currency/country values in console.*", () => {
  let consoleSpies: ReturnType<typeof vi.spyOn>[];

  beforeEach(() => {
    consoleSpies = consoleMethods.map((method) =>
      vi.spyOn(console, method).mockImplementation(() => {}),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not log currency/country fields during DB open and createSnapshot (default + explicit)", () => {
    const { createSnapshot, close } = makeDb();

    createSnapshot({
      customerId: "jordan",
      ie: iePatSurplus,
      outcome: assess(iePatSurplus),
    });

    createSnapshot({
      customerId: "jordan",
      ie: iePatSurplus,
      outcome: assess(iePatSurplus),
      currency: "GBP",
      countryCode: "GB",
    });

    const logged = consoleSpies
      .flatMap((spy) => spy.mock.calls)
      .flat()
      .filter((arg: unknown): arg is string => typeof arg === "string")
      .join("\n");

    for (const token of forbiddenSubstrings) {
      expect(logged).not.toContain(token);
    }

    close();
  });
});
