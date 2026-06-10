import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DashboardView } from "../../components/DashboardView";
import {
  deltaChangeImproved,
  deltaChangeUnchanged,
  deltaChangeWorsened,
} from "../_fixtures/delta";
import { snapshotWithOutcome } from "../_fixtures/snapshots";
import { buildDashboardProps } from "../_helpers/buildDashboardProps";

describe("T33 — DashboardView: delta change sentence", () => {
  afterEach(() => {
    cleanup();
  });

  it.each([
    ["improved", deltaChangeImproved, /\+£500/, /improved/i],
    ["worsened", deltaChangeWorsened, /−£300/, /worsened/i],
    ["unchanged", deltaChangeUnchanged, /£0/, /unchanged/i],
  ] as const)(
    "renders disposable change and band indicator when %s",
    (_label, delta, amountPattern, bandPattern) => {
      const snapshot = snapshotWithOutcome("surplus");
      const props = buildDashboardProps({
        personaId: "pat",
        outcome: snapshot.outcome,
        delta,
      });

      const { container } = render(<DashboardView {...props} />);
      const deltaSection = within(container).getByRole("region", {
        name: /how you've changed/i,
      });
      const deltaText = within(deltaSection).getByText(
        /disposable income has changed/i,
      ).textContent;

      expect(deltaText).toMatch(amountPattern);
      expect(deltaText).toMatch(/; your band is/i);
      expect(deltaText).toMatch(bandPattern);
    },
  );
});
