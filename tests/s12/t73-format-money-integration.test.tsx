import { render, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DashboardView } from "../../components/DashboardView";
import { formatMoney } from "../../lib/affordability/format";
import { computeDelta } from "../../lib/dashboard/computeDelta";
import { renderSnapshotPdfToBuffer } from "../../lib/pdf/render";
import {
  formattedJordanDisposable,
  snapshotJordanStoredGbp,
} from "../_fixtures/snapshots";
import { buildDashboardProps } from "../_helpers/buildDashboardProps";
import { pdfTextExtractor } from "../_helpers/pdfText";

describe("T73 — S12: formatMoney integration (PDF money strings match on-screen render)", () => {
  let container: HTMLElement | null = null;

  afterEach(() => {
    container?.remove();
    container = null;
    vi.restoreAllMocks();
  });

  it("every dashboard money string appears verbatim in the extracted PDF text", async () => {
    const snapshot = snapshotJordanStoredGbp;

    const buffer = await renderSnapshotPdfToBuffer(snapshot);
    const pdfText = await pdfTextExtractor(buffer);

    const props = buildDashboardProps({
      personaId: snapshot.customerId,
      outcome: snapshot.outcome,
      delta: computeDelta([snapshot]),
    });

    const rendered = render(
      <DashboardView
        {...props}
        currency={snapshot.currency}
        countryCode={snapshot.countryCode}
      />,
    );
    container = rendered.container;
    const main = within(container).getByRole("main");

    const expectedIncome = formatMoney(
      snapshot.outcome.totalIncomePence,
      snapshot.currency,
      snapshot.countryCode,
    );
    const expectedExpenditure = formatMoney(
      snapshot.outcome.totalExpenditurePence,
      snapshot.currency,
      snapshot.countryCode,
    );

    const screenText = main.textContent ?? "";
    expect(screenText).toContain(expectedIncome);
    expect(screenText).toContain(expectedExpenditure);

    expect(pdfText).toContain(formattedJordanDisposable);
    expect(pdfText).toContain(expectedIncome);
    expect(pdfText).toContain(expectedExpenditure);
  }, 20_000);
});
