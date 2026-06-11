import { describe, expect, it } from "vitest";
import { assess } from "../../lib/affordability/calculator";
import { formatMoney } from "../../lib/affordability/format";
import { ieJordanShortfall } from "../_fixtures/ie";
import { makeDb } from "../_helpers";

describe("T49 — S10: formatMoney helper — locale-aware output", () => {
  it("formats positive pence as £1,234.50", () => {
    expect(formatMoney(123450, "GBP", "GB")).toBe("£1,234.50");
  });

  it("formats zero pence as £0.00", () => {
    expect(formatMoney(0, "GBP", "GB")).toBe("£0.00");
  });

  it("formats one pence as £0.01", () => {
    expect(formatMoney(1, "GBP", "GB")).toBe("£0.01");
  });

  it("formats negative pence with the locale's minus indicator and a stable body", () => {
    const formatted = formatMoney(-50000, "GBP", "GB");
    expect(formatted).toMatch(/^[−-]/);
    expect(formatted.slice(1)).toBe("£500.00");
  });

  it("cross-check: formats a stored Jordan snapshot's disposable income as a £-prefixed money string", () => {
    const { createSnapshot, getLatestSnapshot, close } = makeDb();
    createSnapshot({
      customerId: "jordan",
      ie: ieJordanShortfall,
      outcome: assess(ieJordanShortfall),
    });
    const stored = getLatestSnapshot("jordan");
    if (!stored) {
      throw new Error("expected stored snapshot");
    }
    const rendered = formatMoney(
      stored.outcome.disposableIncomePence,
      stored.currency,
      stored.countryCode,
    );
    expect(rendered).toMatch(/^[−-]?£[0-9,]+\.[0-9]{2}$/);
    close();
  });
});
