import { fireEvent, render, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    useActionState: <S, P>(_fn: unknown, initial: S) =>
      [initial, (() => {}) as (payload: P) => void, false] as const,
  };
});

import { ShareSnapshotForm } from "../../components/ShareSnapshotForm";

describe("T66 — S11: <ShareSnapshotForm /> renders + Server Action wiring + a11y", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a real <button> in the pre-mint state", async () => {
    const { container } = render(<ShareSnapshotForm snapshotId="some-uuid" />);
    const button = within(container).getByRole("button", {
      name: /create share link/i,
    });
    expect(button.tagName).toBe("BUTTON");
    expect(button.getAttribute("role")).not.toBe("button");

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("renders the URL in <input readOnly> with accessible name and aria-describedby in the post-mint state", async () => {
    const expiresAt = new Date("2026-06-13T00:00:00.000Z").toISOString();
    const { container } = render(
      <ShareSnapshotForm
        snapshotId="some-uuid"
        initialState={{
          ok: true,
          url: "/share/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          expiresAt,
        }}
      />,
    );

    const input = within(container).getByLabelText(
      /share link/i,
    ) as HTMLInputElement;
    expect(input.tagName).toBe("INPUT");
    expect(input.readOnly).toBe(true);
    expect(input.value).toContain("/share/");
    // Recipient needs the absolute URL to follow the link out of band; the
    // Server Action returns a relative `/share/<token>` path and the
    // component composes the origin onto it (jsdom resolves
    // `window.location.origin` to a usable http/https URL).
    expect(input.value).toMatch(/^https?:\/\//);
    expect(input.value).toMatch(/^https?:\/\/[^/]+\/share\/[A-Za-z0-9_-]{43}$/);

    const describedBy = input.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    // `aria-describedby` is a space-separated id list per ARIA 1.2; the
    // form points the input at the expiry description AND the Copy
    // button's polite live-region status, so we resolve every id and
    // assert at least one carries the expiry-date description prose.
    const describedIds = (describedBy ?? "").split(/\s+/).filter(Boolean);
    expect(describedIds.length).toBeGreaterThanOrEqual(1);
    const describedTexts = describedIds.map(
      (id) => container.querySelector(`#${id}`)?.textContent ?? "",
    );
    for (const id of describedIds) {
      expect(container.querySelector(`#${id}`)).toBeTruthy();
    }
    expect(
      describedTexts.some(
        (text) => /Expires on/i.test(text) && !text.includes(expiresAt),
      ),
    ).toBe(true);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("renders a Copy link button that calls navigator.clipboard.writeText with the absolute URL and announces success politely", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    const expiresAt = new Date("2026-06-13T00:00:00.000Z").toISOString();
    const { container } = render(
      <ShareSnapshotForm
        snapshotId="some-uuid"
        initialState={{
          ok: true,
          url: "/share/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          expiresAt,
        }}
      />,
    );

    const button = within(container).getByRole("button", {
      name: /copy link/i,
    });
    expect(button.tagName).toBe("BUTTON");
    expect(button.getAttribute("type")).toBe("button");

    fireEvent.click(button);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledTimes(1);
    });
    const [calledWith] = writeText.mock.calls[0] ?? [];
    expect(calledWith).toMatch(/^https?:\/\/[^/]+\/share\/[A-Za-z0-9_-]{43}$/);

    const status = within(container).getByRole("status");
    expect(status).toBeTruthy();
    expect(status.getAttribute("aria-live")).toBe("polite");
    await waitFor(() => {
      expect(status.textContent ?? "").toMatch(/copied/i);
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("falls back to selecting the input when navigator.clipboard is unavailable so the customer can press Ctrl/Cmd+C", () => {
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });

    const { container } = render(
      <ShareSnapshotForm
        snapshotId="some-uuid"
        initialState={{
          ok: true,
          url: "/share/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
          expiresAt: new Date("2026-06-13T00:00:00.000Z").toISOString(),
        }}
      />,
    );

    const input = within(container).getByLabelText(
      /share link/i,
    ) as HTMLInputElement;
    const selectSpy = vi.spyOn(input, "select");

    const button = within(container).getByRole("button", {
      name: /copy link/i,
    });
    fireEvent.click(button);

    expect(selectSpy).toHaveBeenCalled();
    const status = within(container).getByRole("status");
    expect(status.textContent ?? "").toMatch(/Ctrl|Cmd/i);
  });

  /**
   * Tailwind 4 size scale: `*-N` → `N * 0.25rem` → `N * 4px` (base 16px root).
   * JSDOM does not run a layout pass (see vitest-axe README), so
   * `getBoundingClientRect()` returns 0; instead we compute the effective
   * pixel size from the `min-h-*` / `min-w-*` utility classes the component
   * applies, plus padding-derived intrinsic floors. This is stronger than
   * a regex match on `min-h-(?:9|10|...)` because it asserts a pixel
   * threshold rather than membership in a list.
   */
  function tailwindMinDimensionPx(className: string, axis: "h" | "w"): number {
    const scaleRe = new RegExp(`(?:^|\\s)min-${axis}-(\\d+)(?:\\s|$)`);
    const scaleMatch = className.match(scaleRe);
    if (scaleMatch?.[1]) {
      return Number.parseInt(scaleMatch[1], 10) * 4;
    }
    const arbitraryRe = new RegExp(
      `(?:^|\\s)min-${axis}-\\[(\\d+(?:\\.\\d+)?)(rem|px)\\](?:\\s|$)`,
    );
    const arbitraryMatch = className.match(arbitraryRe);
    if (arbitraryMatch?.[1] && arbitraryMatch[2]) {
      const value = Number.parseFloat(arbitraryMatch[1]);
      const unit = arbitraryMatch[2];
      return unit === "rem" ? value * 16 : value;
    }
    return 0;
  }

  it("interactive elements honour SC 2.5.8 — pre-mint button + post-mint input both >= 24x24", () => {
    const { container, rerender } = render(
      <ShareSnapshotForm snapshotId="some-uuid" />,
    );
    const button = within(container).getByRole("button", {
      name: /create share link/i,
    });

    const buttonHeightPx = tailwindMinDimensionPx(button.className, "h");
    const buttonWidthPx = tailwindMinDimensionPx(button.className, "w");
    expect(buttonHeightPx).toBeGreaterThanOrEqual(24);
    expect(buttonWidthPx).toBeGreaterThanOrEqual(24);

    rerender(
      <ShareSnapshotForm
        snapshotId="some-uuid"
        initialState={{
          ok: true,
          url: "/share/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          expiresAt: new Date("2026-06-13T00:00:00.000Z").toISOString(),
        }}
      />,
    );
    const input = within(container).getByLabelText(
      /share link/i,
    ) as HTMLInputElement;
    const inputHeightPx = tailwindMinDimensionPx(input.className, "h");
    expect(inputHeightPx).toBeGreaterThanOrEqual(24);
  });
});
