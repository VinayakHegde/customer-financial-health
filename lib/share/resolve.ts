import type { Snapshot } from "../affordability/types";
import { getShareLinkByTokenHash, getSnapshotById } from "../db";
import { hashShareToken } from "./token";

/**
 * Single page-extracted helper that the `/share/[token]` page delegates to.
 *
 * Three miss arms collapse to a single `null`:
 *   1. unknown token (hash not in `share_links`)
 *   2. expired row (`expires_at <= now`)
 *   3. snapshot row missing (orphaned `share_links` row)
 *
 * The page-level renderer uses this single signal to render
 * `<ShareUnavailable />` identically across all three arms — same copy, same
 * response headers (the headers come from `middleware.ts`, not from the
 * page). The caller cannot distinguish, which is what keeps the
 * same-response posture structural rather than convention-based.
 */
export async function resolveShare(
  token: string,
  now: Date,
): Promise<Snapshot | null> {
  const tokenHash = hashShareToken(token);
  const link = getShareLinkByTokenHash(tokenHash, now);
  if (!link) {
    return null;
  }
  const snapshot = getSnapshotById(link.snapshotId);
  if (!snapshot) {
    return null;
  }
  return snapshot;
}
