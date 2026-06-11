import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardView } from "../../components/DashboardView";
import { assess } from "../../lib/affordability/calculator";
import { deltaNoSnapshot } from "../_fixtures/delta";
import { ieRileyNoData } from "../_fixtures/ie";
import { buildDashboardProps } from "../_helpers/buildDashboardProps";

describe("DashboardView: no-snapshot delta copy", () => {
  it("does not show first-snapshot copy when no snapshots exist", () => {
    const outcome = assess(ieRileyNoData);
    const props = buildDashboardProps({
      personaId: "riley",
      outcome,
      delta: deltaNoSnapshot,
    });

    render(<DashboardView {...props} />);

    expect(screen.queryByText(/first snapshot/i)).toBeNull();
    expect(
      screen.getByText(/once you submit your income and outgoings/i),
    ).toBeDefined();
  });
});
