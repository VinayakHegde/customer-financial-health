import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { snapshotJordanStoredGbp } from "../_fixtures/snapshots";
import { withPersonaCookie } from "../_helpers/withPersonaCookie";

const dbState = vi.hoisted(() => ({
  snapshotsById: new Map<string, unknown>(),
}));

vi.mock("../../lib/db", () => ({
  getSnapshotById: (id: string) => dbState.snapshotsById.get(id) ?? null,
}));

import { GET } from "../../src/app/(main)/dashboard/snapshot/[id]/pdf/route";

describe("T69 — S12: Route handler happy-path response shape", () => {
  let teardown: (() => void) | undefined;

  beforeEach(() => {
    teardown = withPersonaCookie("jordan");
    dbState.snapshotsById.set(
      snapshotJordanStoredGbp.id,
      snapshotJordanStoredGbp,
    );
  });

  afterEach(() => {
    teardown?.();
    teardown = undefined;
    dbState.snapshotsById.clear();
    vi.restoreAllMocks();
  });

  it("returns 200 with application/pdf, attachment Content-Disposition, no-store, and a %PDF-prefixed body", async () => {
    const response = await GET(new Request("http://test/pdf"), {
      params: Promise.resolve({ id: snapshotJordanStoredGbp.id }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");

    const disposition = response.headers.get("Content-Disposition");
    expect(disposition).not.toBeNull();
    expect(disposition).toMatch(
      /^attachment; filename="financial-snapshot-\d{4}-\d{2}-\d{2}\.pdf"$/,
    );
    const datePart = snapshotJordanStoredGbp.takenAt.slice(0, 10);
    expect(disposition).toContain(datePart);

    expect(response.headers.get("Cache-Control")).toBe("no-store, private");

    const ab = await response.arrayBuffer();
    expect(ab.byteLength).toBeGreaterThan(0);
    const prefix = Buffer.from(ab).slice(0, 5).toString("latin1");
    expect(prefix).toBe("%PDF-");
  });
});
