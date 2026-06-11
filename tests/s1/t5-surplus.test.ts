import { describe, expect, it } from "vitest";
import { assess } from "../../lib/affordability/calculator";
import { iePatSurplus, ieSamNearBreakeven } from "../_fixtures/ie";

describe("T5 — Calculator: surplus branch + near-breakeven note", () => {
  it("includes a near-breakeven note when disposable is within 5% of income", () => {
    const outcome = assess(ieSamNearBreakeven);

    expect(outcome.state).toBe("surplus");
    expect(outcome.band).toBe("surplus");
    expect(outcome.disposableIncomePence).toBeGreaterThan(0);
    expect(outcome.disposableIncomePence).toBeLessThanOrEqual(
      Math.floor((outcome.totalIncomePence * 5) / 100),
    );
    expect(
      outcome.reasons.some((reason) =>
        reason.toLowerCase().includes("small amount"),
      ),
    ).toBe(true);
  });

  it("does not include the near-breakeven note for a comfortable surplus", () => {
    const outcome = assess(iePatSurplus);

    expect(outcome.state).toBe("surplus");
    expect(
      outcome.reasons.some((reason) =>
        reason.toLowerCase().includes("small amount"),
      ),
    ).toBe(false);
  });
});
