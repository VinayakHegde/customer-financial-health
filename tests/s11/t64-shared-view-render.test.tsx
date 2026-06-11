import { readFileSync } from "node:fs";
import { resolve as resolvePath } from "node:path";
import { render, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { SharedStatementView } from "../../components/SharedStatementView";
import { assess } from "../../lib/affordability/calculator";
import { formatMoney } from "../../lib/affordability/format";
import type { Snapshot } from "../../lib/affordability/types";
import { personas } from "../../lib/personas";
import ShareLayout from "../../src/app/(share)/layout";
import {
  ieAlexZeroIncome,
  ieCaseyIrregular,
  ieJordanShortfall,
  ieMorganDrewJoint,
  iePatSurplus,
  ieRileyNoData,
  ieSamNearBreakeven,
} from "../_fixtures/ie";

const ieByPersona: Record<string, Snapshot["ie"]> = {
  pat: iePatSurplus,
  sam: ieSamNearBreakeven,
  jordan: ieJordanShortfall,
  alex: ieAlexZeroIncome,
  riley: ieRileyNoData,
  casey: ieCaseyIrregular,
  "morgan-drew": ieMorganDrewJoint,
};

// Production snapshot ids are UUIDs (`randomUUID()` in `lib/db/snapshots.ts`).
// The fixture deliberately uses a UUID-shaped id so the persona-id never
// reaches the rendered DOM via `id` / `aria-labelledby` / `key` attributes —
// closes critic F1.1 (the previous `fixture-${personaId}` shape planted the
// persona id into DOM attributes outside the persona-leak scan, weakening
// the test even though production UUIDs are leak-safe).
const snapshotIdByPersona: Record<string, string> = {
  pat: "11111111-1111-4111-8111-111111111111",
  sam: "22222222-2222-4222-8222-222222222222",
  jordan: "33333333-3333-4333-8333-333333333333",
  alex: "44444444-4444-4444-8444-444444444444",
  riley: "55555555-5555-4555-8555-555555555555",
  casey: "66666666-6666-4666-8666-666666666666",
  "morgan-drew": "77777777-7777-4777-8777-777777777777",
};

function makeSnapshot(personaId: string): Snapshot {
  const ie = ieByPersona[personaId] ?? ieRileyNoData;
  const id =
    snapshotIdByPersona[personaId] ?? "00000000-0000-4000-8000-000000000000";
  return {
    id,
    customerId: personaId,
    takenAt: "2026-06-01T10:00:00.000Z",
    currency: "GBP",
    countryCode: "GB",
    ie,
    outcome: assess(ie),
  };
}

const personaIds = personas.map((p) => p.id);
const personaLabels = personas.map((p) => p.label);
const PERSONA_LEAK_PATHS = [
  "/dashboard",
  "/dashboard/update",
  "/history",
] as const;

const SHARE_LAYOUT_PATH = resolvePath(
  process.cwd(),
  "src/app/(share)/layout.tsx",
);
const SHARE_PAGE_PATH = resolvePath(
  process.cwd(),
  "src/app/(share)/share/[token]/page.tsx",
);

describe("T64 — S11: <SharedStatementView /> render + persona-leak DOM contract + a11y", () => {
  let containers: HTMLElement[];

  beforeEach(() => {
    containers = [];
  });

  afterEach(() => {
    for (const c of containers) {
      c.remove();
    }
    vi.restoreAllMocks();
  });

  it.each(personaIds)(
    "renders for persona %s with formatMoney + framing notice + signpost; no persona-leak references",
    async (personaId) => {
      const snapshot = makeSnapshot(personaId);
      const { container } = render(
        <ShareLayout>
          <SharedStatementView snapshot={snapshot} />
        </ShareLayout>,
      );
      containers.push(container);

      const main = within(container).getByRole("main");
      expect(main).toBeTruthy();

      if (snapshot.outcome.state !== "no-data") {
        const expectedIncome = formatMoney(
          snapshot.outcome.totalIncomePence,
          snapshot.currency,
          snapshot.countryCode,
        );
        expect(main.textContent ?? "").toContain(expectedIncome);
      }

      expect(
        within(container).getByText(/About this assessment/i),
      ).toBeTruthy();
      expect(
        within(container).getByRole("heading", {
          level: 2,
          name: /^Support$/,
        }),
      ).toBeTruthy();

      const allText = container.textContent ?? "";
      const links = container.querySelectorAll("a");
      for (const link of Array.from(links)) {
        const href = link.getAttribute("href") ?? "";
        for (const path of PERSONA_LEAK_PATHS) {
          expect(href).not.toBe(path);
          expect(href.startsWith(`${path}/`)).toBe(false);
        }
        for (const id of personaIds) {
          expect(href).not.toContain(`/${id}`);
        }
      }
      const allElements = container.querySelectorAll("*");
      for (const el of Array.from(allElements)) {
        const ariaLabel = el.getAttribute("aria-label") ?? "";
        for (const id of personaIds) {
          expect(ariaLabel).not.toContain(id);
        }
        for (const label of personaLabels) {
          expect(ariaLabel).not.toContain(label);
        }
      }
      for (const label of personaLabels) {
        expect(allText).not.toContain(label);
      }

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    },
  );

  it("neither (share)/layout.tsx nor (share)/share/[token]/page.tsx import AppHeader", () => {
    const layoutSrc = readFileSync(SHARE_LAYOUT_PATH, "utf8");
    const pageSrc = readFileSync(SHARE_PAGE_PATH, "utf8");
    const importRe =
      /^\s*import\b[^;]*\b(?:AppHeader|AppHeaderClientRegion)\b[^;]*;/m;
    expect(layoutSrc).not.toMatch(importRe);
    expect(pageSrc).not.toMatch(importRe);
  });
});
