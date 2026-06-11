import { assess } from "../../lib/affordability/calculator";
import type { OutcomeState, Snapshot } from "../../lib/affordability/types";
import {
  ieAlexZeroIncome,
  ieBreakevenExact,
  ieJordanShortfall,
  iePatSurplus,
  ieRileyNoData,
} from "./ie";

const ieByState: Record<OutcomeState, Snapshot["ie"]> = {
  surplus: iePatSurplus,
  breakeven: ieBreakevenExact,
  shortfall: ieJordanShortfall,
  "zero-income": ieAlexZeroIncome,
  "no-data": ieRileyNoData,
};

export function snapshotWithOutcome(state: OutcomeState): Snapshot {
  const ie = ieByState[state];
  const outcome = assess(ie);

  return {
    id: `fixture-snapshot-${state}`,
    customerId: "pat",
    takenAt: "2026-06-01T10:00:00.000Z",
    currency: "GBP",
    countryCode: "GB",
    ie,
    outcome,
  };
}
