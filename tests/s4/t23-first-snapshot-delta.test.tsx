import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardView } from "../../components/DashboardView";
import { deltaFirstSnapshot } from "../_fixtures/delta";
import { snapshotWithOutcome } from "../_fixtures/snapshots";
import { buildDashboardProps } from "../_helpers/buildDashboardProps";

describe("T23 — DashboardView: first-snapshot delta placeholder", () => {
  it("renders the A2 placeholder copy", () => {
    const snapshot = snapshotWithOutcome("surplus");
    const props = buildDashboardProps({
      personaId: "pat",
      outcome: snapshot.outcome,
      delta: deltaFirstSnapshot,
    });

    render(<DashboardView {...props} />);

    expect(screen.getByText(/first snapshot/i)).toBeDefined();
    expect(screen.getByText(/once you submit again/i)).toBeDefined();
  });
});
