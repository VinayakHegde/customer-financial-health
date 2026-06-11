import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { HistoryList } from "../../components/HistoryList";
import { assess } from "../../lib/affordability/calculator";
import { framingNotice } from "../../lib/affordability/framing";
import type { Snapshot } from "../../lib/affordability/types";
import {
  ieJordanShortfall,
  iePatSurplus,
  ieRileyNoData,
} from "../_fixtures/ie";

function snapshotAt(
  id: string,
  customerId: string,
  takenAt: string,
  ie: Snapshot["ie"],
): Snapshot {
  return { id, customerId, takenAt, ie, outcome: assess(ie) };
}

describe("T26 — HistoryList: empty and populated states", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders empty-state message, CTA to /dashboard/update, signpost and framing", async () => {
    const { container } = render(<HistoryList snapshots={[]} />);

    expect(screen.getByText(/no submissions yet/i)).toBeDefined();

    const cta = within(container).getByRole("link", {
      name: /add your first submission/i,
    });
    expect(cta.getAttribute("href")).toBe("/dashboard/update");

    expect(screen.getByRole("heading", { name: /^support$/i })).toBeDefined();
    expect(
      screen.getByRole("complementary", {
        name: framingNotice().headline,
      }),
    ).toBeDefined();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("renders an ordered list with <time dateTime>, suppresses band chip on no-data rows, and exposes a <details> disclosure per row", async () => {
    const snapshots: Snapshot[] = [
      snapshotAt("snap-1", "pat", "2026-06-10T09:30:00.000Z", iePatSurplus),
      snapshotAt(
        "snap-2",
        "pat",
        "2026-06-01T08:00:00.000Z",
        ieJordanShortfall,
      ),
      snapshotAt("snap-3", "pat", "2026-05-20T07:15:00.000Z", ieRileyNoData),
    ];

    const { container } = render(<HistoryList snapshots={snapshots} />);

    const list = container.querySelector("ol");
    expect(list).toBeTruthy();
    const items = (list as HTMLElement).querySelectorAll(":scope > li");
    expect(items.length).toBe(snapshots.length);

    const expectedStateLabels = ["Surplus", "Shortfall", "No data yet"];

    snapshots.forEach((snapshot, index) => {
      const item = items[index] as HTMLElement;
      const timeEl = item.querySelector("time");
      expect(timeEl).toBeTruthy();
      expect(timeEl?.getAttribute("dateTime")).toBe(snapshot.takenAt);

      const disclosure = item.querySelector("details");
      expect(disclosure).toBeTruthy();
      expect(disclosure?.querySelector("summary")).toBeTruthy();

      const stateLabel = item.querySelector(
        "[data-testid='outcome-state-label']",
      );
      expect(stateLabel).toBeTruthy();
      expect(stateLabel?.textContent?.trim()).toBe(expectedStateLabels[index]);
    });

    const noDataRow = items[2] as HTMLElement;
    expect(noDataRow.querySelector("[data-testid='band-chip']")).toBeNull();
    expect(
      noDataRow.querySelector("[data-testid='disposable-income']"),
    ).toBeNull();

    const surplusRow = items[0] as HTMLElement;
    expect(surplusRow.querySelector("[data-testid='band-chip']")).toBeTruthy();
    expect(
      surplusRow.querySelector("[data-testid='disposable-income']"),
    ).toBeTruthy();

    expect(screen.getByRole("heading", { name: /^support$/i })).toBeDefined();
    expect(
      screen.getByRole("complementary", {
        name: framingNotice().headline,
      }),
    ).toBeDefined();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
