import { describe, expect, it } from "vitest";
import { assess } from "../../lib/affordability/calculator";
import type {
  IncomeAndExpenditure,
  Snapshot,
} from "../../lib/affordability/types";
import { computeDelta } from "../../lib/dashboard/computeDelta";
import { ieJordanShortfall, iePatSurplus } from "../_fixtures/ie";

function toSnapshot(
  id: string,
  takenAt: string,
  ie: IncomeAndExpenditure,
): Snapshot {
  return {
    id,
    customerId: "pat",
    takenAt,
    ie,
    outcome: assess(ie),
  };
}

describe("computeDelta — dashboard delta computation (S4)", () => {
  it("returns no-snapshot when no snapshots exist", () => {
    expect(computeDelta([])).toEqual({ kind: "no-snapshot" });
  });

  it("returns first-snapshot when exactly one snapshot exists", () => {
    expect(
      computeDelta([
        toSnapshot("one", "2026-06-01T10:00:00.000Z", iePatSurplus),
      ]),
    ).toEqual({
      kind: "first-snapshot",
    });
  });

  it("computes disposable delta pence from latest vs previous snapshot", () => {
    const current = toSnapshot(
      "current",
      "2026-06-02T10:00:00.000Z",
      iePatSurplus,
    );
    const previous = toSnapshot(
      "previous",
      "2026-06-01T10:00:00.000Z",
      ieJordanShortfall,
    );

    const delta = computeDelta([current, previous]);

    expect(delta).toMatchObject({
      kind: "change",
      disposableDeltaPence:
        current.outcome.disposableIncomePence -
        previous.outcome.disposableIncomePence,
      previousTakenAt: previous.takenAt,
    });
  });

  it("marks band change as improved when band rank rises", () => {
    const current = toSnapshot(
      "current",
      "2026-06-02T10:00:00.000Z",
      iePatSurplus,
    );
    const previous = toSnapshot(
      "previous",
      "2026-06-01T10:00:00.000Z",
      ieJordanShortfall,
    );

    expect(computeDelta([current, previous])).toMatchObject({
      kind: "change",
      bandChange: "improved",
    });
  });

  it("marks band change as worsened when band rank falls", () => {
    const current = toSnapshot(
      "current",
      "2026-06-02T10:00:00.000Z",
      ieJordanShortfall,
    );
    const previous = toSnapshot(
      "previous",
      "2026-06-01T10:00:00.000Z",
      iePatSurplus,
    );

    expect(computeDelta([current, previous])).toMatchObject({
      kind: "change",
      bandChange: "worsened",
    });
  });

  it("marks band change as unchanged when band rank is equal", () => {
    const previous = toSnapshot(
      "previous",
      "2026-06-01T10:00:00.000Z",
      iePatSurplus,
    );
    const current: Snapshot = {
      ...toSnapshot("current", "2026-06-02T10:00:00.000Z", iePatSurplus),
      outcome: {
        ...assess(iePatSurplus),
        disposableIncomePence:
          assess(iePatSurplus).disposableIncomePence + 10_000,
      },
    };

    expect(computeDelta([current, previous])).toMatchObject({
      kind: "change",
      bandChange: "unchanged",
    });
  });
});
