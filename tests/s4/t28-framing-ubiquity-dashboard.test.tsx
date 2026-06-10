import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardView } from "../../components/DashboardView";
import { framingNotice } from "../../lib/affordability/framing";
import { deltaFirstSnapshot } from "../_fixtures/delta";
import { snapshotWithOutcome } from "../_fixtures/snapshots";
import { buildDashboardProps } from "../_helpers/buildDashboardProps";

describe("T28 — Framing ubiquity across outcome views (dashboard half)", () => {
  it("renders FramingNotice inside DashboardView", () => {
    const snapshot = snapshotWithOutcome("surplus");
    const props = buildDashboardProps({
      personaId: "pat",
      outcome: snapshot.outcome,
      delta: deltaFirstSnapshot,
    });

    render(<DashboardView {...props} />);

    expect(
      screen.getByRole("complementary", {
        name: framingNotice().headline,
      }),
    ).toBeDefined();
  });
});
