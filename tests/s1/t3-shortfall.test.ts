import { describe, expect, it } from "vitest";
import { assess } from "../../lib/affordability/calculator";
import { ieJordanShortfall } from "../_fixtures/ie";

describe("T3 — Calculator: shortfall branch", () => {
  it("returns shortfall with reasons citing the gap and largest outgoing", () => {
    const outcome = assess(ieJordanShortfall);

    expect(outcome.state).toBe("shortfall");
    expect(outcome.band).toBe("shortfall");
    expect(outcome.disposableIncomePence).toBeLessThan(0);

    const combinedReasons = outcome.reasons.join(" ").toLowerCase();
    expect(combinedReasons).toContain("£280");
    expect(combinedReasons).toContain("rent");
  });
});
