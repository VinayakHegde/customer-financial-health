import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import pkg from "../../package.json";

describe("T30 — Vitest harness boots", () => {
  it("configures jsdom and required plugins", () => {
    const configSource = readFileSync(
      resolve(process.cwd(), "vitest.config.mts"),
      "utf-8",
    );
    expect(configSource).toContain('environment: "jsdom"');
    expect(configSource).toContain("@vitejs/plugin-react");
    expect(configSource).toContain("vite-tsconfig-paths");
    expect(configSource).toContain("./vitest-setup.ts");
    expect(pkg.scripts.test).toBe("vitest run");
    expect(pkg.scripts["test:watch"]).toBe("vitest");
  });

  it("loads vitest-axe matchers via setup file", async () => {
    const { axe } = await import("vitest-axe");
    expect(typeof axe).toBe("function");
    expect({ violations: [] }).toHaveNoViolations();

    const results = await axe("<main><p>Accessible content</p></main>");
    expect(results.violations).toBeDefined();
  });
});
