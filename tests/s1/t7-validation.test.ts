import { describe, expect, it } from "vitest";
import { validateIncomeAndExpenditure } from "../../lib/affordability/validation";
import {
  ieNegativeAmount,
  ieNonNumericAmount,
  ieOversizeLabel,
  ieWhitespaceLabel,
} from "../_fixtures/ie";

describe("T7 — Validation: reject invalid input", () => {
  it("rejects negative amounts with field-level errors", () => {
    const result = validateIncomeAndExpenditure(ieNegativeAmount);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]?.field).toBeTruthy();
      expect(result.errors[0]?.message).toBeTruthy();
    }
  });

  it("rejects non-numeric amounts without throwing", () => {
    expect(() =>
      validateIncomeAndExpenditure(ieNonNumericAmount),
    ).not.toThrow();
    const result = validateIncomeAndExpenditure(ieNonNumericAmount);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it("rejects oversize labels", () => {
    const result = validateIncomeAndExpenditure(ieOversizeLabel);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((error) => error.field.includes("label"))).toBe(
        true,
      );
    }
  });

  it("rejects whitespace-only labels", () => {
    const result = validateIncomeAndExpenditure(ieWhitespaceLabel);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });
});
