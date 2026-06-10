import { describe, expect, it } from "vitest";
import { assess } from "../../lib/affordability/calculator";
import type { Snapshot } from "../../lib/affordability/types";
import { iePatSurplus } from "../_fixtures/ie";
import { makeDb } from "../_helpers";

function expectSnapshotShape(snapshot: Snapshot) {
  expect(typeof snapshot.id).toBe("string");
  expect(typeof snapshot.customerId).toBe("string");
  expect(typeof snapshot.takenAt).toBe("string");
  expect(snapshot.ie).toBeDefined();
  expect(snapshot.outcome).toBeDefined();
  expect(Array.isArray(snapshot.outcome.reasons)).toBe(true);
}

describe("T9 — Repository round-trip", () => {
  it("createSnapshot, listSnapshots, and getLatestSnapshot return S1 Snapshot shape with ie_json round-trip", () => {
    const outcome = assess(iePatSurplus);
    const { createSnapshot, listSnapshots, getLatestSnapshot, close } =
      makeDb();

    const created = createSnapshot({
      customerId: "pat",
      ie: iePatSurplus,
      outcome,
    });

    expectSnapshotShape(created);
    expect(created.ie).toEqual(iePatSurplus);
    expect(created.outcome.state).toBe(outcome.state);
    expect(created.outcome.band).toBe(outcome.band);
    expect(created.outcome.totalIncomePence).toBe(outcome.totalIncomePence);
    expect(created.outcome.totalExpenditurePence).toBe(
      outcome.totalExpenditurePence,
    );
    expect(created.outcome.disposableIncomePence).toBe(
      outcome.disposableIncomePence,
    );

    const listed = listSnapshots("pat");
    expect(listed).toHaveLength(1);
    expectSnapshotShape(listed[0]);
    expect(listed[0].id).toBe(created.id);
    expect(listed[0].ie).toEqual(iePatSurplus);

    const latest = getLatestSnapshot("pat");
    if (!latest) {
      throw new Error("expected latest snapshot");
    }
    expectSnapshotShape(latest);
    expect(latest.id).toBe(created.id);
    expect(latest.ie).toEqual(iePatSurplus);

    close();
  });
});
