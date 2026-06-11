import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { makeDb } from "../_helpers";

type ColumnInfo = {
  name: string;
  type: string;
  notnull: number;
  pk: number;
};

type ForeignKeyInfo = {
  id: number;
  seq: number;
  table: string;
  from: string;
  to: string;
};

type IndexInfo = {
  name: string;
};

describe("T53 — S11: migration adds share_links table + index", () => {
  it("share_links table has the right columns, FK, and idx_share_links_token_hash index", () => {
    const { db, close } = makeDb();

    const columns = db.all<ColumnInfo>(
      sql`PRAGMA table_info('share_links')`,
    ) as ColumnInfo[];
    const byName = Object.fromEntries(columns.map((c) => [c.name, c]));

    expect(byName.id?.type.toUpperCase()).toBe("TEXT");
    expect(byName.id?.pk).toBe(1);

    expect(byName.snapshot_id?.type.toUpperCase()).toBe("TEXT");
    expect(byName.snapshot_id?.notnull).toBe(1);

    expect(byName.token_hash?.type.toUpperCase()).toBe("TEXT");
    expect(byName.token_hash?.notnull).toBe(1);

    expect(byName.expires_at?.type.toUpperCase()).toBe("TEXT");
    expect(byName.expires_at?.notnull).toBe(1);

    expect(byName.created_at?.type.toUpperCase()).toBe("TEXT");
    expect(byName.created_at?.notnull).toBe(1);

    const fks = db.all<ForeignKeyInfo>(
      sql`PRAGMA foreign_key_list('share_links')`,
    ) as ForeignKeyInfo[];
    expect(
      fks.some(
        (fk) =>
          fk.table === "snapshots" &&
          fk.from === "snapshot_id" &&
          fk.to === "id",
      ),
    ).toBe(true);

    const indexes = db.all<IndexInfo>(
      sql`PRAGMA index_list('share_links')`,
    ) as IndexInfo[];
    expect(
      indexes.some((index) => index.name === "idx_share_links_token_hash"),
    ).toBe(true);

    close();
  });
});
