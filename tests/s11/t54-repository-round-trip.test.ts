import { describe, expect, it } from "vitest";
import { assess } from "../../lib/affordability/calculator";
import { iePatSurplus } from "../_fixtures/ie";
import {
  nowJustAfterExpiry,
  pinnedNowUtc,
  shareTokenPinned,
} from "../_fixtures/snapshots";
import { makeDb } from "../_helpers";

describe("T54 — S11: repository round-trip + expiry / unknown-hash both return null", () => {
  it("findable while live; null after expiry; null on unknown hash", () => {
    const { createSnapshot, createShareLink, getShareLinkByTokenHash, close } =
      makeDb();

    const snap = createSnapshot({
      customerId: "jordan",
      ie: iePatSurplus,
      outcome: assess(iePatSurplus),
    });

    const expires = new Date(pinnedNowUtc.getTime() + 24 * 60 * 60 * 1000);
    createShareLink({
      snapshotId: snap.id,
      tokenHash: shareTokenPinned.hash,
      expiresAt: expires.toISOString(),
      createdAt: pinnedNowUtc.toISOString(),
    });

    const live = getShareLinkByTokenHash(shareTokenPinned.hash, pinnedNowUtc);
    expect(live).not.toBeNull();
    expect(live?.snapshotId).toBe(snap.id);

    const expired = getShareLinkByTokenHash(
      shareTokenPinned.hash,
      nowJustAfterExpiry,
    );
    expect(expired).toBeNull();

    const unknown = getShareLinkByTokenHash("0".repeat(64), pinnedNowUtc);
    expect(unknown).toBeNull();

    close();
  });
});
