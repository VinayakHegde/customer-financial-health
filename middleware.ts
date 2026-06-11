import { type NextRequest, NextResponse } from "next/server";

/**
 * S11 — emit cache + robots headers on `/share/*`.
 *
 * Server Components in Next.js 16 cannot set outgoing response headers
 * (`next/headers` exposes the inbound request headers as a read-only
 * handle, per
 * `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/headers.md`),
 * so the share page cannot emit `Cache-Control` or `X-Robots-Tag` directly.
 *
 * This middleware matches on pathname (`/share/:path*`), so header parity
 * across all four resolver arms — unknown token / expired / snapshot-row-
 * missing / happy path — is **structural**. A single test row (T61)
 * asserts the middleware function directly; per-arm HTTP round-trips are
 * not needed.
 *
 * Negative coverage: `/`, `/dashboard*`, `/history`, `/dashboard/snapshot/
 * <id>/pdf` are all pass-throughs — the share matcher does not over-
 * broaden onto MVP routes or onto S12's PDF route (S12 sets its own
 * headers in the Route Handler `Response` directly).
 */
const SHARE_PATH_PREFIX = "/share/";

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith(SHARE_PATH_PREFIX)) {
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "no-store, private");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/share/:path*"],
};
