import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DashboardView } from "../../components/DashboardView";
import { deltaFirstSnapshot } from "../_fixtures/delta";
import { snapshotWithOutcome } from "../_fixtures/snapshots";
import { buildDashboardProps } from "../_helpers/buildDashboardProps";

const forbiddenDisposableTokens = ["loss", "gain"] as const;

describe("T21 — DashboardView: disposable sign indicator (R6)", () => {
  afterEach(() => {
    cleanup();
  });

  it.each([
    ["surplus", "+"],
    ["shortfall", "−"],
  ] as const)(
    "uses a %s sign prefix for %s disposable income",
    (state, sign) => {
      const snapshot = snapshotWithOutcome(state);
      const props = buildDashboardProps({
        personaId: "pat",
        outcome: snapshot.outcome,
        delta: deltaFirstSnapshot,
      });

      const { container } = render(<DashboardView {...props} />);
      const disposableLine = within(container).getByTestId("disposable-income");
      const disposableText = disposableLine.textContent?.toLowerCase() ?? "";

      expect(disposableLine.textContent).toContain(sign);
      expect(disposableLine.textContent).toContain("£");

      for (const token of forbiddenDisposableTokens) {
        expect(disposableText).not.toContain(token);
      }
    },
  );
});
