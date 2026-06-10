import { describe, expect, it } from "vitest";
import { assess } from "../../lib/affordability/calculator";
import { ieRileyNoData } from "../_fixtures/ie";
import { makeDb } from "../_helpers";

describe("T11 — Repository: no-data band persists as null", () => {
  it("persists and reads back band null for no-data outcome", () => {
    const outcome = assess(ieRileyNoData);
    expect(outcome.band).toBeNull();

    const { createSnapshot, getLatestSnapshot, close } = makeDb();
    createSnapshot({
      customerId: "riley",
      ie: ieRileyNoData,
      outcome,
    });

    const latest = getLatestSnapshot("riley");
    if (!latest) {
      throw new Error("expected latest snapshot");
    }
    expect(latest.outcome.band).toBeNull();
    expect(latest.outcome.state).toBe("no-data");

    close();
  });
});
