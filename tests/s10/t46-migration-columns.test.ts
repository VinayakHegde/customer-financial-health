import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { makeDb } from "../_helpers";

type ColumnInfo = {
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
};

describe("T46 — S10: migration adds currency and country_code columns", () => {
  it("snapshots table has currency TEXT NOT NULL DEFAULT 'GBP' and country_code TEXT NOT NULL DEFAULT 'GB'", () => {
    const { db, close } = makeDb();

    const rows = db.all<ColumnInfo>(
      sql`PRAGMA table_info('snapshots')`,
    ) as ColumnInfo[];

    const byName = Object.fromEntries(rows.map((row) => [row.name, row]));

    expect(byName.currency).toBeDefined();
    expect(byName.currency.type.toUpperCase()).toBe("TEXT");
    expect(byName.currency.notnull).toBe(1);
    expect(byName.currency.dflt_value).toBe("'GBP'");

    expect(byName.country_code).toBeDefined();
    expect(byName.country_code.type.toUpperCase()).toBe("TEXT");
    expect(byName.country_code.notnull).toBe(1);
    expect(byName.country_code.dflt_value).toBe("'GB'");

    close();
  });
});
