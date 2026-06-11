import { describe, expect, it } from "vitest";
import { assess } from "../../lib/affordability/calculator";
import { formatMoney } from "../../lib/affordability/format";
import type { OutcomeState, Snapshot } from "../../lib/affordability/types";
import { renderSnapshotPdfToBuffer } from "../../lib/pdf/render";
import {
  ieAlexZeroIncome,
  ieBreakevenExact,
  ieJordanShortfall,
  iePatSurplus,
  ieRileyNoData,
} from "../_fixtures/ie";
import { pdfTextExtractor } from "../_helpers/pdfText";

type Case = {
  state: OutcomeState;
  ie: Snapshot["ie"];
  bandLabel: string;
};

const CASES: Case[] = [
  { state: "surplus", ie: iePatSurplus, bandLabel: "Surplus" },
  { state: "breakeven", ie: ieBreakevenExact, bandLabel: "Breakeven" },
  { state: "shortfall", ie: ieJordanShortfall, bandLabel: "Shortfall" },
  { state: "zero-income", ie: ieAlexZeroIncome, bandLabel: "Zero income" },
  { state: "no-data", ie: ieRileyNoData, bandLabel: "No data" },
];

function makeSnapshot(state: OutcomeState, ie: Snapshot["ie"]): Snapshot {
  return {
    id: `fixture-snapshot-${state}`,
    customerId: "fixture",
    takenAt: "2026-06-01T10:00:00.000Z",
    currency: "GBP",
    countryCode: "GB",
    ie,
    outcome: assess(ie),
  };
}

describe("T72 — S12: renderSnapshotPdfToBuffer smoke + outcome-state content coverage", () => {
  it.each(CASES)(
    "produces a %PDF buffer for $state containing band, disposable, framing, signpost, reason",
    async ({ state, ie, bandLabel }) => {
      const snapshot = makeSnapshot(state, ie);

      const buffer = await renderSnapshotPdfToBuffer(snapshot);

      expect(buffer.length).toBeGreaterThan(0);
      expect(buffer.slice(0, 5).toString("latin1")).toBe("%PDF-");

      const text = await pdfTextExtractor(buffer);

      expect(text).toContain(bandLabel);

      if (state !== "no-data") {
        const disposable = formatMoney(
          snapshot.outcome.disposableIncomePence,
          snapshot.currency,
          snapshot.countryCode,
        );
        expect(text).toContain(disposable);
      }

      expect(text).toContain("not financial advice");

      // R7 broadening: support-signpost copy block + URL appear in PDF.
      expect(text).toContain("/support");

      if (state !== "no-data") {
        const reasons = snapshot.outcome.reasons;
        expect(reasons.length).toBeGreaterThan(0);
        const reasonHit = reasons.some((reason) => text.includes(reason));
        expect(reasonHit).toBe(true);
      }
    },
    20_000,
  );
});
