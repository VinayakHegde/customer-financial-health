import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { HistoryList } from "../../components/HistoryList";
import { assess } from "../../lib/affordability/calculator";
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
  return {
    id,
    customerId,
    takenAt,
    currency: "GBP",
    countryCode: "GB",
    ie,
    outcome: assess(ie),
  };
}

describe("T39 — HistoryList: accessibility smoke (populated)", () => {
  afterEach(() => {
    cleanup();
  });

  it("uses <dl>/<dt>/<dd> semantics inside each disclosure", () => {
    const snapshots: Snapshot[] = [
      snapshotAt("snap-1", "pat", "2026-06-10T09:30:00.000Z", iePatSurplus),
      snapshotAt(
        "snap-2",
        "pat",
        "2026-06-01T08:00:00.000Z",
        ieJordanShortfall,
      ),
    ];

    const { container } = render(<HistoryList snapshots={snapshots} />);

    const items = container.querySelectorAll("ol > li");
    expect(items.length).toBe(snapshots.length);

    items.forEach((item, index) => {
      const disclosure = item.querySelector("details");
      expect(disclosure).toBeTruthy();

      const definitionLists = (disclosure as HTMLElement).querySelectorAll(
        "dl",
      );
      expect(definitionLists.length).toBeGreaterThan(0);

      const dts = (disclosure as HTMLElement).querySelectorAll("dt");
      const dds = (disclosure as HTMLElement).querySelectorAll("dd");
      expect(dts.length).toBeGreaterThan(0);
      expect(dts.length).toBe(dds.length);

      const snapshot = snapshots[index];
      const expectedLines =
        snapshot.ie.earners.length + snapshot.ie.expenditure.length;
      expect(dts.length).toBe(expectedLines);
    });
  });

  it("renders a disclosure <summary> whose minimum-height utility meets SC 2.5.8 (≥24 CSS px)", () => {
    const snapshots: Snapshot[] = [
      snapshotAt("snap-1", "pat", "2026-06-10T09:30:00.000Z", iePatSurplus),
    ];

    const { container } = render(<HistoryList snapshots={snapshots} />);

    const summary = container.querySelector(
      "ol > li details > summary",
    ) as HTMLElement | null;
    expect(summary).toBeTruthy();
    expect(summary?.className ?? "").toMatch(/min-h-6/);
  });

  it("passes axe on a populated list (including the no-data row)", async () => {
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

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
