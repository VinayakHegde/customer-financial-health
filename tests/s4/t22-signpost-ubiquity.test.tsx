import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DashboardView } from "../../components/DashboardView";
import { assess } from "../../lib/affordability/calculator";
import { deltaFirstSnapshot } from "../_fixtures/delta";
import {
  ieAlexZeroIncome,
  ieJordanShortfall,
  ieRileyNoData,
} from "../_fixtures/ie";
import { buildDashboardProps } from "../_helpers/buildDashboardProps";

describe("T22 — DashboardView: signpost ubiquity", () => {
  afterEach(() => {
    cleanup();
  });

  it.each([
    ["no-data", ieRileyNoData, "riley"],
    ["zero-income", ieAlexZeroIncome, "alex"],
    ["shortfall", ieJordanShortfall, "jordan"],
  ] as const)(
    "renders a non-empty support link for %s",
    (_label, ie, personaId) => {
      const outcome = assess(ie);
      const props = buildDashboardProps({
        personaId,
        outcome,
        delta: deltaFirstSnapshot,
      });

      const { container } = render(<DashboardView {...props} />);

      const link = within(container).getByRole("link", {
        name: props.copy.supportSignpost.label,
      });
      expect(link.getAttribute("href")).toBeTruthy();
      expect(link.textContent?.trim().length).toBeGreaterThan(0);
    },
  );
});
