import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const snapshots = sqliteTable(
  "snapshots",
  {
    id: text("id").primaryKey(),
    customerId: text("customer_id").notNull(),
    takenAt: text("taken_at").notNull(),
    ieJson: text("ie_json").notNull(),
    outcomeState: text("outcome_state").notNull(),
    band: text("band"),
    incomePence: integer("income_pence").notNull(),
    expenditurePence: integer("expenditure_pence").notNull(),
    disposablePence: integer("disposable_pence").notNull(),
    currency: text("currency").notNull().default("GBP"),
    countryCode: text("country_code").notNull().default("GB"),
  },
  (table) => [
    index("idx_snapshots_customer_taken").on(table.customerId, table.takenAt),
  ],
);

/**
 * S11 — shared-statement links.
 *
 * `id` is the future revocation handle (deferred per tech-spec §5 trade-off
 * "S11 revocation deferred"); the column lands once so a revocation slice can
 * DELETE / UPDATE by primary key without a schema change. Not exposed in the
 * action's return shape today.
 *
 * `customer_id` is deliberately absent — the join through
 * `snapshot_id → snapshots.customer_id` is the customer scope. Keeps the
 * leak surface narrow.
 *
 * `token_hash` is SHA-256 hex of the raw bearer token. The raw token is never
 * persisted; it appears only in the URL once, at mint time.
 */
export const shareLinks = sqliteTable(
  "share_links",
  {
    id: text("id").primaryKey(),
    snapshotId: text("snapshot_id")
      .notNull()
      .references(() => snapshots.id),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("idx_share_links_token_hash").on(table.tokenHash)],
);
