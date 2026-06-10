import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { assess } from "../../lib/affordability/calculator";
import { ieJordanShortfall } from "../_fixtures/ie";
import { makeDb } from "../_helpers";

describe("T12 — DB logging hygiene", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "debug").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not log I&E amounts, persona ids, or earner/expenditure labels", () => {
    const { createSnapshot, close } = makeDb();

    createSnapshot({
      customerId: "jordan",
      ie: ieJordanShortfall,
      outcome: assess(ieJordanShortfall),
    });
    createSnapshot({
      customerId: "jordan",
      ie: ieJordanShortfall,
      outcome: assess(ieJordanShortfall),
    });

    const logged = logSpy.mock.calls
      .flat()
      .filter((arg: unknown): arg is string => typeof arg === "string")
      .join("\n");

    const forbidden = [
      "165000",
      "105000",
      "36000",
      "22000",
      "jordan",
      "Jordan",
      "Rent",
      "Loan",
      "Food",
      "Travel",
      "Utilities",
    ];

    for (const token of forbidden) {
      expect(logged.toLowerCase()).not.toContain(token.toLowerCase());
    }

    close();
  });
});
