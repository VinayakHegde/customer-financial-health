import * as fs from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { snapshotJordanStoredGbp } from "../_fixtures/snapshots";
import { withPersonaCookie } from "../_helpers/withPersonaCookie";

const dbState = vi.hoisted(() => ({
  snapshotsById: new Map<string, unknown>(),
}));

vi.mock("../../lib/db", () => ({
  getSnapshotById: (id: string) => dbState.snapshotsById.get(id) ?? null,
}));

// Replace the synchronous + streaming write surface with spies. ESM namespace
// properties are not configurable, so `vi.spyOn(fs, 'writeFileSync')` /
// `vi.spyOn(fs, 'createWriteStream')` / `vi.spyOn(fs, 'appendFileSync')`
// throw ("Cannot redefine property"); `vi.mock` is the only way to intercept
// those named exports while leaving the rest of `node:fs` intact. The rest of
// the test's dependencies (better-sqlite3, mocked at the lib/db boundary
// above) never reach `node:fs` during the GET. `fs.promises.writeFile` and
// `fs.promises.appendFile` live on a regular configurable object and are
// covered by `vi.spyOn` in `beforeEach` below.
const writeFileSyncSpy = vi.hoisted(() => vi.fn());
const appendFileSyncSpy = vi.hoisted(() => vi.fn());
const createWriteStreamSpy = vi.hoisted(() => vi.fn());
vi.mock("node:fs", async () => {
  const actual = await vi.importActual<typeof import("node:fs")>("node:fs");
  return {
    ...actual,
    default: actual,
    writeFileSync: writeFileSyncSpy,
    appendFileSync: appendFileSyncSpy,
    createWriteStream: createWriteStreamSpy,
  };
});

import { GET } from "../../src/app/(main)/dashboard/snapshot/[id]/pdf/route";

describe("T75 — S12: no file written to disk during PDF generation", () => {
  let teardown: (() => void) | undefined;
  let writeFileSpy: ReturnType<typeof vi.spyOn>;
  let appendFileSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    teardown = withPersonaCookie("jordan");
    dbState.snapshotsById.set(
      snapshotJordanStoredGbp.id,
      snapshotJordanStoredGbp,
    );
    writeFileSpy = vi.spyOn(fs.promises, "writeFile");
    appendFileSpy = vi.spyOn(fs.promises, "appendFile");
    writeFileSyncSpy.mockClear();
    appendFileSyncSpy.mockClear();
    createWriteStreamSpy.mockClear();
  });

  afterEach(() => {
    teardown?.();
    teardown = undefined;
    dbState.snapshotsById.clear();
    vi.restoreAllMocks();
  });

  it("records zero writeFile / writeFileSync / appendFile / appendFileSync / createWriteStream calls across one full GET", async () => {
    const response = await GET(new Request("http://test/pdf"), {
      params: Promise.resolve({ id: snapshotJordanStoredGbp.id }),
    });
    expect(response.status).toBe(200);
    await response.arrayBuffer();

    expect(writeFileSpy.mock.calls.length).toBe(0);
    expect(writeFileSyncSpy.mock.calls.length).toBe(0);
    expect(appendFileSpy.mock.calls.length).toBe(0);
    expect(appendFileSyncSpy.mock.calls.length).toBe(0);
    expect(createWriteStreamSpy.mock.calls.length).toBe(0);
  }, 20_000);
});
