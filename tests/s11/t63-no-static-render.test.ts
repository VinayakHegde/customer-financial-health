import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const PAGE_PATH = resolve(
  process.cwd(),
  "src/app/(share)/share/[token]/page.tsx",
);

describe("T63 — S11: /share/[token] page has no static-render directive", () => {
  it("source contains no revalidate, no force-static, no unstable_cache(", () => {
    const source = readFileSync(PAGE_PATH, "utf8");
    expect(source).not.toMatch(/export\s+const\s+revalidate/);
    expect(source).not.toMatch(
      /export\s+const\s+dynamic\s*=\s*['"]force-static['"]/,
    );
    expect(source).not.toMatch(/unstable_cache\s*\(/);
  });
});
