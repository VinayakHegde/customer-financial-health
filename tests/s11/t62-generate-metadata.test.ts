import { describe, expect, it } from "vitest";
import { generateMetadata } from "../../src/app/(share)/share/[token]/page";

describe("T62 — S11: generateMetadata exports robots noindex/nofollow", () => {
  it("returns robots: { index: false, follow: false }", () => {
    const meta = generateMetadata();
    expect(meta.robots).toBeDefined();
    if (typeof meta.robots === "string") {
      expect(meta.robots).toMatch(/noindex/i);
      expect(meta.robots).toMatch(/nofollow/i);
    } else {
      expect(meta.robots).toMatchObject({ index: false, follow: false });
    }
  });
});
