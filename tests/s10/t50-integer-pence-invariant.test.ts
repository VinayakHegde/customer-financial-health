import { describe, expect, it } from "vitest";
import { assess } from "../../lib/affordability/calculator";
import type { IncomeAndExpenditure } from "../../lib/affordability/types";
import { computeDelta } from "../../lib/dashboard/computeDelta";
import {
  ieAlexZeroIncome,
  ieBreakevenExact,
  ieCaseyIrregular,
  ieJordanShortfall,
  ieMorganDrewJoint,
  iePatSurplus,
  ieRileyNoData,
  ieSamNearBreakeven,
} from "../_fixtures/ie";
import { makeDb } from "../_helpers";

const personaCases: { customerId: string; ie: IncomeAndExpenditure }[] = [
  { customerId: "pat", ie: iePatSurplus },
  { customerId: "sam", ie: ieSamNearBreakeven },
  { customerId: "jordan", ie: ieJordanShortfall },
  { customerId: "alex", ie: ieAlexZeroIncome },
  { customerId: "riley", ie: ieRileyNoData },
  { customerId: "casey", ie: ieCaseyIrregular },
  { customerId: "morgan-drew", ie: ieMorganDrewJoint },
  { customerId: "taylor", ie: ieBreakevenExact },
];

describe("T50 — S10: integer-pence invariant preserved at every persistence boundary", () => {
  it.each(personaCases)(
    "persists $customerId outcome with all *Pence fields as integers",
    ({ customerId, ie }) => {
      const { createSnapshot, getLatestSnapshot, close } = makeDb();

      createSnapshot({
        customerId,
        ie,
        outcome: assess(ie),
      });

      const latest = getLatestSnapshot(customerId);
      if (!latest) {
        throw new Error("expected latest snapshot");
      }

      expect(Number.isInteger(latest.outcome.totalIncomePence)).toBe(true);
      expect(Number.isInteger(latest.outcome.totalExpenditurePence)).toBe(true);
      expect(Number.isInteger(latest.outcome.disposableIncomePence)).toBe(true);

      close();
    },
  );

  it("computeDelta.disposableDeltaPence remains integer across all persona pairs after persistence", () => {
    for (let index = 0; index < personaCases.length; index += 1) {
      const { customerId, ie } = personaCases[index];
      const nextIe = personaCases[(index + 1) % personaCases.length].ie;
      const { createSnapshot, listSnapshots, close } = makeDb();

      createSnapshot({ customerId, ie, outcome: assess(ie) });
      createSnapshot({
        customerId,
        ie: nextIe,
        outcome: assess(nextIe),
      });

      const delta = computeDelta(listSnapshots(customerId));
      expect(delta.kind).toBe("change");
      if (delta.kind === "change") {
        expect(Number.isInteger(delta.disposableDeltaPence)).toBe(true);
      }

      close();
    }
  });
});
