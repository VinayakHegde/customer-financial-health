import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SupportPage from "../../src/app/support/page";

describe("Support page", () => {
  it("renders support content and a link back home", () => {
    render(<SupportPage />);

    expect(screen.getByRole("heading", { name: /support/i })).toBeDefined();
    expect(
      screen
        .getByRole("link", { name: /back to persona picker/i })
        .getAttribute("href"),
    ).toBe("/");
  });
});
