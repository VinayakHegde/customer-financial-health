import { describe, expect, it } from "vitest";
import { middleware } from "../../middleware";

type StubRequest = { nextUrl: { pathname: string } };

function invoke(pathname: string) {
  const request = { nextUrl: { pathname } } as StubRequest;
  return middleware(request as unknown as Parameters<typeof middleware>[0]);
}

describe("T61 — S11: middleware emits cache + robots headers on /share/* only", () => {
  it.each([
    "/share/abc123",
    "/share/garbage",
    "/share/expired-fixture-token",
    "/share/snapshot-missing-fixture-token",
  ])("emits Cache-Control + X-Robots-Tag for %s", (path) => {
    const response = invoke(path);
    expect(response.headers.get("Cache-Control")).toBe("no-store, private");
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
  });

  it.each([
    "/",
    "/dashboard",
    "/dashboard/update",
    "/history",
    "/dashboard/snapshot/some-uuid/pdf",
  ])("does NOT set the share-specific headers for %s", (path) => {
    const response = invoke(path);
    expect(response.headers.get("Cache-Control")).not.toBe("no-store, private");
    expect(response.headers.get("X-Robots-Tag")).not.toBe("noindex, nofollow");
  });
});
