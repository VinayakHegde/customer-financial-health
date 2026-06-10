import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { DashboardView } from "../../components/DashboardView";
import { allOutcomeStates } from "../../lib/affordability/copy";
import { framingNotice } from "../../lib/affordability/framing";
import { deltaFirstSnapshot } from "../_fixtures/delta";
import { snapshotWithOutcome } from "../_fixtures/snapshots";
import { buildDashboardProps } from "../_helpers/buildDashboardProps";

describe("T21 — DashboardView: outcome states render", () => {
  afterEach(() => {
    cleanup();
  });

  it.each(allOutcomeStates.map((state) => [state] as const))(
    "renders headline, reasons, signpost, and framing for %s",
    async (state) => {
      const snapshot = snapshotWithOutcome(state);
      const props = buildDashboardProps({
        personaId: "pat",
        outcome: snapshot.outcome,
        delta: deltaFirstSnapshot,
      });

      const { container } = render(<DashboardView {...props} />);

      expect(
        screen.getByRole("heading", { level: 1, name: props.copy.headline }),
      ).toBeDefined();
      expect(
        screen.getByRole("heading", { name: /why this result/i }),
      ).toBeDefined();

      for (const reason of snapshot.outcome.reasons) {
        expect(screen.getByText(reason)).toBeDefined();
      }

      expect(
        within(container).getByRole("link", {
          name: props.copy.supportSignpost.label,
        }),
      ).toBeDefined();
      expect(
        screen.getByRole("complementary", {
          name: framingNotice().headline,
        }),
      ).toBeDefined();

      if (state === "no-data" || snapshot.outcome.band === null) {
        expect(screen.queryByTestId("band-chip")).toBeNull();
        expect(screen.queryByTestId("disposable-income")).toBeNull();
      } else {
        expect(screen.getByTestId("band-chip")).toBeDefined();
        expect(screen.getByTestId("disposable-income")).toBeDefined();
      }

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    },
  );
});
