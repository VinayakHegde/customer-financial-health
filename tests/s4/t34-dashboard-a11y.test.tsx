import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { DashboardView } from "../../components/DashboardView";
import { assess } from "../../lib/affordability/calculator";
import { personas } from "../../lib/personas";
import { deltaFirstSnapshot } from "../_fixtures/delta";
import { buildDashboardProps } from "../_helpers/buildDashboardProps";

describe("T34 — DashboardView: accessibility smoke", () => {
  afterEach(() => {
    cleanup();
  });

  it.each(personas.map((persona) => [persona.id, persona] as const))(
    "has landmarks and passes axe for persona %s",
    async (_id, persona) => {
      const outcome = assess(persona.startingIe);
      const props = buildDashboardProps({
        personaId: persona.id,
        outcome,
        delta: deltaFirstSnapshot,
      });

      const { container } = render(<DashboardView {...props} />);

      const main = container.querySelector("main");
      expect(main).toBeTruthy();

      const h1 = within(main as HTMLElement).getByRole("heading", {
        level: 1,
      });
      expect(h1).toBeDefined();

      const sections = (main as HTMLElement).querySelectorAll("section");
      expect(sections.length).toBeGreaterThan(0);

      for (const section of sections) {
        const labelledBy = section.getAttribute("aria-labelledby");
        expect(labelledBy).toBeTruthy();
        expect(document.getElementById(labelledBy as string)).toBeTruthy();
      }

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    },
  );
});
