import { describe, expect, it } from "vitest";
import { assess } from "../../lib/affordability/calculator";
import { ieAlexZeroIncome } from "../_fixtures/ie";

describe("T2 — Calculator: zero-income branch", () => {
  it("returns zero-income with shortfall band and negative disposable", () => {
    const outcome = assess(ieAlexZeroIncome);

    expect(outcome.state).toBe("zero-income");
    expect(outcome.band).toBe("shortfall");
    expect(outcome.disposableIncomePence).toBeLessThan(0);
  });
});
