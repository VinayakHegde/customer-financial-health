import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { HistoryList } from "../../components/HistoryList";
import { assess } from "../../lib/affordability/calculator";
import { framingNotice } from "../../lib/affordability/framing";
import type { Snapshot } from "../../lib/affordability/types";
import { iePatSurplus } from "../_fixtures/ie";

describe("T28 — Framing ubiquity across outcome views (history half)", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders FramingNotice inside HistoryList for the empty state", () => {
    render(<HistoryList snapshots={[]} />);

    expect(
      screen.getByRole("complementary", {
        name: framingNotice().headline,
      }),
    ).toBeDefined();
  });

  it("renders FramingNotice inside HistoryList for the populated state", () => {
    const snapshot: Snapshot = {
      id: "snap-1",
      customerId: "pat",
      takenAt: "2026-06-10T09:30:00.000Z",
      currency: "GBP",
      countryCode: "GB",
      ie: iePatSurplus,
      outcome: assess(iePatSurplus),
    };

    render(<HistoryList snapshots={[snapshot]} />);

    expect(
      screen.getByRole("complementary", {
        name: framingNotice().headline,
      }),
    ).toBeDefined();
  });
});
