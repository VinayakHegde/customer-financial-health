import { assess } from "../../lib/affordability/calculator";
import { formatMoney } from "../../lib/affordability/format";
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

/* ---------- S12 stretch fixtures ---------- */

/**
 * Stored Snapshot shape for `jordan` carrying `currency: 'GBP'` and
 * `countryCode: 'GB'` exactly as the repository would emit after a round-trip
 * through `createSnapshot` + `getLatestSnapshot`. Built as a pure literal so
 * the tests that consume it (T69 / T72 / T73 / T74 / T75) do not need a live
 * SQLite handle just to assemble the fixture. `id` is a static UUID-shaped
 * string so the snapshot id never collides with a production `randomUUID()`
 * and so the persona-id is not embedded in the id itself (mirrors the T64
 * D-223 leak-guard pattern).
 */
export const snapshotJordanStoredGbp: Snapshot = {
  id: "88888888-8888-4888-8888-888888888888",
  customerId: "jordan",
  takenAt: "2026-06-01T10:00:00.000Z",
  currency: "GBP",
  countryCode: "GB",
  ie: ieJordanShortfall,
  outcome: assess(ieJordanShortfall),
};

/** Same shape, owned by `pat`. Used by T70 (cross-persona 404 parity). */
export const snapshotPatStoredGbp: Snapshot = {
  id: "99999999-9999-4999-8999-999999999999",
  customerId: "pat",
  takenAt: "2026-06-01T10:00:00.000Z",
  currency: "GBP",
  countryCode: "GB",
  ie: iePatSurplus,
  outcome: assess(iePatSurplus),
};

/**
 * `formatMoney(snapshotJordanStoredGbp.outcome.disposableIncomePence, 'GBP',
 * 'GB')` — pre-computed so T73's "every dashboard money string appears in
 * the PDF" assertion can reference a known literal. Per TEST_PLAN §2.3, this
 * is the canonical reference for the cross-surface no-drift guard.
 */
export const formattedJordanDisposable: string = formatMoney(
  snapshotJordanStoredGbp.outcome.disposableIncomePence,
  snapshotJordanStoredGbp.currency,
  snapshotJordanStoredGbp.countryCode,
);
