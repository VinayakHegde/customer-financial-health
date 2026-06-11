import { describe, expect, it } from "vitest";
import { assess } from "../../lib/affordability/calculator";
import { computeDelta } from "../../lib/dashboard/computeDelta";
import { ieJordanShortfall } from "../_fixtures/ie";
import { makeDb } from "../_helpers";

describe("T36 — First-snapshot delta shape (repository level)", () => {
  it("returns first-snapshot when exactly one snapshot exists for a customer", () => {
    const { createSnapshot, listSnapshots, close } = makeDb();

    createSnapshot({
      customerId: "jordan",
      ie: ieJordanShortfall,
      outcome: assess(ieJordanShortfall),
    });

    const delta = computeDelta(listSnapshots("jordan"));
    expect(delta).toEqual({ kind: "first-snapshot" });

    close();
  });
});
