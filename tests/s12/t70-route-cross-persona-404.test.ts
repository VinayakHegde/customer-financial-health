import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  snapshotJordanStoredGbp,
  snapshotPatStoredGbp,
} from "../_fixtures/snapshots";
import { withPersonaCookie } from "../_helpers/withPersonaCookie";

const dbState = vi.hoisted(() => ({
  snapshotsById: new Map<string, unknown>(),
}));

const renderSpy = vi.hoisted(() => vi.fn());

vi.mock("../../lib/db", () => ({
  getSnapshotById: (id: string) => dbState.snapshotsById.get(id) ?? null,
}));

vi.mock("../../lib/pdf/render", () => ({
  renderSnapshotPdfToBuffer: (...args: unknown[]) => {
    renderSpy(...args);
    return Promise.resolve(Buffer.from("%PDF-mock"));
  },
}));

import { GET } from "../../src/app/(main)/dashboard/snapshot/[id]/pdf/route";

describe("T70 — S12: cross-persona returns 404 (no information leak)", () => {
  let teardown: (() => void) | undefined;

  beforeEach(() => {
    teardown = withPersonaCookie("jordan");
    dbState.snapshotsById.set(
      snapshotJordanStoredGbp.id,
      snapshotJordanStoredGbp,
    );
    dbState.snapshotsById.set(snapshotPatStoredGbp.id, snapshotPatStoredGbp);
    renderSpy.mockClear();
  });

  afterEach(() => {
    teardown?.();
    teardown = undefined;
    dbState.snapshotsById.clear();
    vi.restoreAllMocks();
  });

  it("returns byte-identical 404 'Not Found' for cross-persona AND non-existent snapshot ids; renderer never called", async () => {
    const crossPersona = await GET(new Request("http://test/pdf"), {
      params: Promise.resolve({ id: snapshotPatStoredGbp.id }),
    });
    const crossBody = await crossPersona.text();

    const missing = await GET(new Request("http://test/pdf"), {
      params: Promise.resolve({ id: "00000000-0000-0000-0000-000000000000" }),
    });
    const missingBody = await missing.text();

    expect(crossPersona.status).toBe(404);
    expect(missing.status).toBe(404);
    expect(crossBody).toBe("Not Found");
    expect(missingBody).toBe("Not Found");
    expect(crossBody).toBe(missingBody);
    // Header parity — a 404 that leaked a different Content-Type, set a
    // Content-Disposition, or set a cacheable Cache-Control would distinguish
    // "cross-persona" from "missing-snapshot" by side channel even with
    // identical bodies. The 404 surface intentionally exposes no extra info.
    expect(crossPersona.headers.get("Content-Type")).toBe(
      missing.headers.get("Content-Type"),
    );
    expect(crossPersona.headers.get("Content-Disposition")).toBe(
      missing.headers.get("Content-Disposition"),
    );
    expect(crossPersona.headers.get("Cache-Control")).toBe(
      missing.headers.get("Cache-Control"),
    );
    expect(renderSpy).not.toHaveBeenCalled();
  });
});
