import { describe, expect, it } from "vitest";
import { assess } from "../../lib/affordability/calculator";
import { ieBreakevenExact } from "../_fixtures/ie";

describe("T4 — Calculator: breakeven branch", () => {
  it("returns breakeven when income exactly meets outgoings", () => {
    const outcome = assess(ieBreakevenExact);

    expect(outcome.state).toBe("breakeven");
    expect(outcome.band).toBe("breakeven");
    expect(outcome.disposableIncomePence).toBe(0);
    expect(
      outcome.reasons.some((reason) =>
        reason.toLowerCase().includes("exactly meets"),
      ),
    ).toBe(true);
  });
});
