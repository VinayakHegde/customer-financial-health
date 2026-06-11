import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { assess } from "../../lib/affordability/calculator";
import { snapshots } from "../../lib/db/schema";
import { iePatSurplus } from "../_fixtures/ie";
import { makeDb } from "../_helpers";

describe("T47 — S10: default backfill on createSnapshot without explicit fields", () => {
  it("createSnapshot omitting currency/countryCode persists 'GBP'/'GB' and round-trips", () => {
    const { createSnapshot, getLatestSnapshot, db, close } = makeDb();

    const created = createSnapshot({
      customerId: "jordan",
      ie: iePatSurplus,
      outcome: assess(iePatSurplus),
    });

    expect(created.currency).toBe("GBP");
    expect(created.countryCode).toBe("GB");

    const latest = getLatestSnapshot("jordan");
    if (!latest) {
      throw new Error("expected latest snapshot");
    }
    expect(latest.currency).toBe("GBP");
    expect(latest.countryCode).toBe("GB");

    const row = db
      .select()
      .from(snapshots)
      .where(eq(snapshots.id, created.id))
      .get();
    if (!row) {
      throw new Error("expected snapshot row");
    }
    expect(row.currency).toBe("GBP");
    expect(row.countryCode).toBe("GB");

    close();
  });
});
