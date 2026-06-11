import { afterEach, describe, expect, it, vi } from "vitest";
import DashboardPage from "../../src/app/(main)/dashboard/page";
import { withPersonaCookie } from "../_helpers/withPersonaCookie";

const redirectMock = vi.hoisted(() =>
  vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
);

vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirectMock(path),
}));

describe("DashboardPage — invalid persona redirect", () => {
  let teardown: (() => void) | undefined;

  afterEach(() => {
    teardown?.();
    teardown = undefined;
    redirectMock.mockClear();
  });

  it("redirects to / when the persona cookie is not a known persona", async () => {
    teardown = withPersonaCookie("not-a-real-persona");

    await expect(DashboardPage()).rejects.toThrow("REDIRECT:/");
    expect(redirectMock).toHaveBeenCalledWith("/");
  });
});
