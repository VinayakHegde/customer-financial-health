import { assess } from "../../lib/affordability/calculator";
import type { OutcomeState, Snapshot } from "../../lib/affordability/types";
import { generateShareToken } from "../../lib/share/token";
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

/* ---------- S11 / S12 stretch fixtures ---------- */

/**
 * Pinned UTC instant used by every S11 test that needs `nowUtc()` to return
 * a known value. Mocked via `vi.mock('../../lib/share/clock', ...)` or via
 * `vi.useFakeTimers(); vi.setSystemTime(pinnedNowUtc)`. Both styles must
 * produce the same fixture behaviour (T55).
 */
export const pinnedNowUtc = new Date("2026-06-12T00:00:00.000Z");

/** One millisecond past the 24-hour boundary from `pinnedNowUtc`. */
export const nowJustAfterExpiry = new Date(
  pinnedNowUtc.getTime() + 24 * 60 * 60 * 1000 + 1,
);

/**
 * A frozen `{ raw, hash }` produced once at module load. Used by tests that
 * need a deterministic hash-lookup target without re-running the random
 * generator.
 */
export const shareTokenPinned: { raw: string; hash: string } =
  generateShareToken();
