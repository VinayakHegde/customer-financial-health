import { render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { ShareUnavailable } from "../../components/ShareUnavailable";
import { personas } from "../../lib/personas";
import ShareLayout from "../../src/app/(share)/layout";

const PERSONA_LEAK_PATHS = ["/dashboard", "/dashboard/update", "/history"];
const personaIds = personas.map((p) => p.id);
const personaLabels = personas.map((p) => p.label);

describe("T65 — S11: <ShareUnavailable /> — same response across all miss arms; no framing/signpost", () => {
  it("renders the same generic copy three independent times (no per-arm variation)", () => {
    const renders = [
      render(
        <ShareLayout>
          <ShareUnavailable />
        </ShareLayout>,
      ),
      render(
        <ShareLayout>
          <ShareUnavailable />
        </ShareLayout>,
      ),
      render(
        <ShareLayout>
          <ShareUnavailable />
        </ShareLayout>,
      ),
    ];

    const texts = renders.map((r) => {
      const main = within(r.container).getByRole("main");
      return main.textContent ?? "";
    });

    expect(texts[0]).toContain("This share link is no longer available");
    expect(new Set(texts).size).toBe(1);

    for (const r of renders) {
      r.unmount();
    }
  });

  it("does not render <FramingNotice /> or <SupportSignpost /> (R20/R7 do not attach)", () => {
    const { container, unmount } = render(
      <ShareLayout>
        <ShareUnavailable />
      </ShareLayout>,
    );

    expect(within(container).queryByText(/About this assessment/i)).toBeNull();
    expect(within(container).queryByText(/Talk to our support/i)).toBeNull();
    expect(within(container).queryByText(/Speak with our support/i)).toBeNull();
    unmount();
  });

  it("contains zero persona-leak references", () => {
    const { container, unmount } = render(
      <ShareLayout>
        <ShareUnavailable />
      </ShareLayout>,
    );

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
    for (const label of personaLabels) {
      expect(allText).not.toContain(label);
    }
    unmount();
  });

  it("vitest-axe smoke is clean", async () => {
    const { container, unmount } = render(
      <ShareLayout>
        <ShareUnavailable />
      </ShareLayout>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
    unmount();
  });
});
