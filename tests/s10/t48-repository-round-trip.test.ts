import { describe, expect, it } from "vitest";
import { assess } from "../../lib/affordability/calculator";
import { ieJordanShortfall, iePatSurplus } from "../_fixtures/ie";
import { makeDb } from "../_helpers";

describe("T48 — S10: repository round-trip carries currency and countryCode", () => {
  it("explicit GBP/GB on two createSnapshot calls flows through getLatestSnapshot and listSnapshots", () => {
    const { createSnapshot, getLatestSnapshot, listSnapshots, close } =
      makeDb();

    const first = createSnapshot({
      customerId: "jordan",
      ie: iePatSurplus,
      outcome: assess(iePatSurplus),
      currency: "GBP",
      countryCode: "GB",
    });

    const second = createSnapshot({
      customerId: "jordan",
      ie: ieJordanShortfall,
      outcome: assess(ieJordanShortfall),
      currency: "GBP",
      countryCode: "GB",
    });

    const latest = getLatestSnapshot("jordan");
    if (!latest) {
      throw new Error("expected latest snapshot");
    }
    expect(latest.currency).toBe("GBP");
    expect(latest.countryCode).toBe("GB");

    const listed = listSnapshots("jordan");
    expect(listed).toHaveLength(2);
    for (const snap of listed) {
      expect(snap.currency).toBe("GBP");
      expect(snap.countryCode).toBe("GB");
    }

    expect(listed[0].id).toBe(second.id);
    expect(listed[1].id).toBe(first.id);
    expect(listed[0].takenAt >= listed[1].takenAt).toBe(true);

    close();
  });
});
