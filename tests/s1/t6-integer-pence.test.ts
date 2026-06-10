import { describe, expect, it } from "vitest";
import { assess } from "../../lib/affordability/calculator";
import type { AffordabilityOutcome } from "../../lib/affordability/types";
import { allIeFixtures } from "../_fixtures/ie";

function numericFields(outcome: AffordabilityOutcome): number[] {
  return [
    outcome.totalIncomePence,
    outcome.totalExpenditurePence,
    outcome.disposableIncomePence,
  ];
}

describe("T6 — Calculator: integer-pence invariant", () => {
  it.each(allIeFixtures.map((fixture, index) => [index, fixture] as const))(
    "returns only integer pence for fixture %i",
    (_index, fixture) => {
      const outcome = assess(fixture);

      for (const value of numericFields(outcome)) {
        expect(Number.isInteger(value)).toBe(true);
      }
    },
  );
});
