import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { HistoryList } from "../../components/HistoryList";
import { assess } from "../../lib/affordability/calculator";
import type { Snapshot } from "../../lib/affordability/types";
import { ieJordanShortfall } from "../_fixtures/ie";

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

describe("T27 — HistoryList: signpost ubiquity", () => {
  afterEach(() => {
    cleanup();
  });

  const cases: [string, Snapshot[]][] = [
    ["empty", []],
    [
      "populated",
      [
        snapshotAt(
          "snap-empty-1",
          "jordan",
          "2026-06-10T09:30:00.000Z",
          ieJordanShortfall,
        ),
      ],
    ],
  ];

  it.each(cases)(
    "renders a support link with a non-empty href and accessible name (%s state)",
    (_label, snapshots) => {
      const { container } = render(<HistoryList snapshots={snapshots} />);

      const supportSection = within(container).getByRole("region", {
        name: /^support$/i,
      });
      const link = within(supportSection).getByRole("link");

      const href = link.getAttribute("href");
      expect(href).toBeTruthy();
      expect((href as string).length).toBeGreaterThan(0);
      expect(link.textContent?.trim().length).toBeGreaterThan(0);
    },
  );
});
