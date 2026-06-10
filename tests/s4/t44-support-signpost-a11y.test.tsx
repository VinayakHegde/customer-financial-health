import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { SupportSignpost } from "../../components/SupportSignpost";
import {
  allOutcomeStates,
  getCopyForOutcome,
} from "../../lib/affordability/copy";

describe("T44 — SupportSignpost: standalone render + axe smoke", () => {
  afterEach(() => {
    cleanup();
  });

  it.each(allOutcomeStates.map((state) => [state] as const))(
    "renders an accessible support link for %s",
    async (state) => {
      const { container } = render(<SupportSignpost state={state} />);
      const copy = getCopyForOutcome(state);

      const link = within(container).getByRole("link", {
        name: copy.supportSignpost.label,
      });
      expect(link.getAttribute("href")).toBeTruthy();
      expect(link.textContent?.trim().length).toBeGreaterThan(0);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    },
  );
});
