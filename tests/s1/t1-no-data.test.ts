import { describe, expect, it } from "vitest";
import { assess } from "../../lib/affordability/calculator";
import { ieRileyNoData } from "../_fixtures/ie";

describe("T1 — Calculator: no-data branch", () => {
  it("returns no-data with null band and zero disposable", () => {
    const outcome = assess(ieRileyNoData);

    expect(outcome.state).toBe("no-data");
    expect(outcome.band).toBeNull();
    expect(outcome.disposableIncomePence).toBe(0);
    expect(
      outcome.reasons.some((reason) =>
        reason.toLowerCase().includes("don't have any income or outgoings"),
      ),
    ).toBe(true);
  });
});
