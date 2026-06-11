import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { snapshotJordanStoredGbp } from "../_fixtures/snapshots";
import { withPersonaCookie } from "../_helpers/withPersonaCookie";

const dbState = vi.hoisted(() => ({
  snapshotsById: new Map<string, unknown>(),
}));

const getSnapshotByIdSpy = vi.hoisted(() => vi.fn());
const renderSpy = vi.hoisted(() => vi.fn());

vi.mock("../../lib/db", () => ({
  getSnapshotById: (id: string) => {
    getSnapshotByIdSpy(id);
    return dbState.snapshotsById.get(id) ?? null;
  },
}));

vi.mock("../../lib/pdf/render", () => ({
  renderSnapshotPdfToBuffer: (...args: unknown[]) => {
    renderSpy(...args);
    return Promise.resolve(Buffer.from("%PDF-mock"));
  },
}));

import { GET } from "../../src/app/(main)/dashboard/snapshot/[id]/pdf/route";

const consoleMethods = ["log", "info", "debug", "warn", "error"] as const;

type Sub = { name: string; cookie: string | null };

const SUB_CASES: Sub[] = [
  { name: "(a) cookie absent", cookie: null },
  { name: "(b) cookie present but empty", cookie: "" },
  { name: "(c) cookie present, not a persona", cookie: "does-not-exist" },
];

describe("T71 — S12: persona validation (missing + invalid cookie)", () => {
  let teardown: (() => void) | undefined;
  let consoleSpies: ReturnType<typeof vi.spyOn>[];

  beforeEach(() => {
    dbState.snapshotsById.set(
      snapshotJordanStoredGbp.id,
      snapshotJordanStoredGbp,
    );
    getSnapshotByIdSpy.mockClear();
    renderSpy.mockClear();
    consoleSpies = consoleMethods.map((method) =>
      vi.spyOn(console, method).mockImplementation(() => {}),
    );
  });

  afterEach(() => {
    teardown?.();
    teardown = undefined;
    dbState.snapshotsById.clear();
    vi.restoreAllMocks();
  });

  for (const { name, cookie } of SUB_CASES) {
    it(`${name}: returns 403 'Forbidden', no DB read, no PDF render, invalid value never logged`, async () => {
      teardown = withPersonaCookie(cookie);

      const response = await GET(new Request("http://test/pdf"), {
        params: Promise.resolve({ id: snapshotJordanStoredGbp.id }),
      });
      const body = await response.text();

      expect(response.status).toBe(403);
      expect(body).toBe("Forbidden");
      expect(getSnapshotByIdSpy).not.toHaveBeenCalled();
      expect(renderSpy).not.toHaveBeenCalled();

      if (cookie !== null && cookie !== "") {
        const logged = consoleSpies
          .flatMap((spy) => spy.mock.calls)
          .flat()
          .filter((arg: unknown): arg is string => typeof arg === "string")
          .join("\n");
        expect(logged).not.toContain(cookie);
      }
    });
  }
});
