import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { FramingNotice } from "../../components/FramingNotice";
import { framingNotice } from "../../lib/affordability/framing";

describe("T32 — FramingNotice component render", () => {
  it("renders an accessible aside with a support link", async () => {
    const copy = framingNotice();
    const { container } = render(<FramingNotice />);

    const aside = screen.getByRole("complementary", {
      name: copy.headline,
    });
    expect(aside.tagName).toBe("ASIDE");

    const labelledBy = aside.getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();

    const heading = screen.getByRole("heading", {
      level: 2,
      name: copy.headline,
    });
    expect(heading.id).toBe(labelledBy);
    expect(screen.getByText(copy.body)).toBeDefined();

    const supportLink = screen.getByRole("link", {
      name: copy.supportLink.label,
    });
    expect(supportLink.getAttribute("href")).toBe(copy.supportLink.href);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
