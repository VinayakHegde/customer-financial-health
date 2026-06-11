import { describe, expect, it } from "vitest";
import * as route from "../../src/app/(main)/dashboard/snapshot/[id]/pdf/route";

describe("T68 — S12: Route handler exports runtime = 'nodejs'", () => {
  it("pins the runtime so @react-pdf/renderer's Node-only APIs don't break under an Edge default", () => {
    expect(route.runtime).toBe("nodejs");
  });
});
