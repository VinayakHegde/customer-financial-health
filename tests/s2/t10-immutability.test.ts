import { describe, expect, it } from "vitest";
import { assess } from "../../lib/affordability/calculator";
import { iePatSurplus, ieSamNearBreakeven } from "../_fixtures/ie";
import { makeDb } from "../_helpers";

describe("T10 — Repository immutability", () => {
  it("keeps both snapshots for the same customerId without update or delete", () => {
    const { createSnapshot, listSnapshots, close } = makeDb();

    const first = createSnapshot({
      customerId: "pat",
      ie: iePatSurplus,
      outcome: assess(iePatSurplus),
    });
    const second = createSnapshot({
      customerId: "pat",
      ie: ieSamNearBreakeven,
      outcome: assess(ieSamNearBreakeven),
    });

    const listed = listSnapshots("pat");
    expect(listed).toHaveLength(2);
    expect(listed[0].id).toBe(second.id);
    expect(listed[1].id).toBe(first.id);
    expect(listed[0].ie).toEqual(ieSamNearBreakeven);
    expect(listed[1].ie).toEqual(iePatSurplus);

    close();
  });
});
