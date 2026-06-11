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
