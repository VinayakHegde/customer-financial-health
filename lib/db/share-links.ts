import { randomUUID } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { shareLinks } from "./schema";

export type CreateShareLinkInput = {
  snapshotId: string;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
};

export type CreateShareLinkResult = {
  id: string;
  expiresAt: string;
};

export type ShareLinkRepository = {
  createShareLink: (input: CreateShareLinkInput) => CreateShareLinkResult;
  getShareLinkByTokenHash: (
    tokenHash: string,
    now: Date,
  ) => { snapshotId: string } | null;
};

/**
 * Repository for `share_links` rows. Both methods take primitive inputs (no
 * raw token, no Date parsing on insert) so the call site stays explicit
 * about what crosses the persistence boundary.
 *
 * `getShareLinkByTokenHash` collapses two miss arms — unknown hash and
 * expired row — into a single `null` return. The caller (the resolver)
 * cannot distinguish, which preserves the same-response posture committed
 * to in tech-spec §S11.
 */
export function createShareLinkRepository(
  db: BetterSQLite3Database,
): ShareLinkRepository {
  return {
    createShareLink(input) {
      const id = randomUUID();
      db.insert(shareLinks)
        .values({
          id,
          snapshotId: input.snapshotId,
          tokenHash: input.tokenHash,
          expiresAt: input.expiresAt,
          createdAt: input.createdAt,
        })
        .run();
      return { id, expiresAt: input.expiresAt };
    },
    getShareLinkByTokenHash(tokenHash, now) {
      const row = db
        .select({ snapshotId: shareLinks.snapshotId })
        .from(shareLinks)
        .where(
          and(
            eq(shareLinks.tokenHash, tokenHash),
            gt(shareLinks.expiresAt, now.toISOString()),
          ),
        )
        .limit(1)
        .get();
      return row ? { snapshotId: row.snapshotId } : null;
    },
  };
}
