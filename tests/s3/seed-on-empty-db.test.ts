import { count } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { snapshots } from "../../lib/db/schema";
import { seedStartingSnapshotsIfEmpty } from "../../lib/db/seed";
import { getPersonasForSeeding } from "../../lib/personas";
import { makeDb } from "../_helpers/makeDb";

describe("S3 — seed on empty DB", () => {
  it("inserts starting snapshots for six personas, skipping riley", () => {
    const repo = makeDb();
    seedStartingSnapshotsIfEmpty(repo.db, repo);

    for (const persona of getPersonasForSeeding()) {
      expect(repo.listSnapshots(persona.id)).toHaveLength(1);
    }
    expect(repo.listSnapshots("riley")).toHaveLength(0);

    const [{ value: total }] = repo.db
      .select({ value: count() })
      .from(snapshots)
      .all();
    expect(total).toBe(6);

    repo.close();
  });

  it("does not re-seed when snapshots already exist", () => {
    const repo = makeDb();
    seedStartingSnapshotsIfEmpty(repo.db, repo);
    seedStartingSnapshotsIfEmpty(repo.db, repo);

    const [{ value: total }] = repo.db
      .select({ value: count() })
      .from(snapshots)
      .all();
    expect(total).toBe(6);

    repo.close();
  });
});
