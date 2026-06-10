import { describe, expect, it } from "vitest";
import { assess } from "../../lib/affordability/calculator";
import { validateIncomeAndExpenditure } from "../../lib/affordability/validation";
import { personas } from "../../lib/personas";

const formulaTokens = ["*", "/", "="] as const;

describe("T8 — Calculator: persona fixture matrix", () => {
  it.each(personas.map((persona) => [persona.id, persona] as const))(
    "assesses persona %s per tech-spec S3 table",
    (_id, persona) => {
      const parsed = validateIncomeAndExpenditure(persona.startingIe);
      expect(parsed.ok).toBe(true);
      if (!parsed.ok) {
        return;
      }

      const outcome = assess(parsed.data);
      expect(outcome.state).toBe(persona.expectedOutcome);

      if (persona.expectedOutcome !== "no-data") {
        expect(outcome.reasons.length).toBeGreaterThan(0);
      }

      for (const reason of outcome.reasons) {
        for (const token of formulaTokens) {
          expect(reason).not.toContain(token);
        }
      }

      if (persona.id === "casey") {
        expect(outcome.irregularIncomeNote).toBeTruthy();
        expect(outcome.irregularIncomeNote?.length).toBeGreaterThan(0);
      }
    },
  );
});
