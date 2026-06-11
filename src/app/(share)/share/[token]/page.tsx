import type { Metadata } from "next";
import { SharedStatementView } from "../../../../../components/SharedStatementView";
import { ShareUnavailable } from "../../../../../components/ShareUnavailable";
import { nowUtc } from "../../../../../lib/share/clock";
import { resolveShare } from "../../../../../lib/share/resolve";

/**
 * The HTML-only-reader fallback for `X-Robots-Tag`. The header itself is the
 * load-bearing assertion; this metadata is best-effort coverage for clients
 * that only parse `<meta>`. Both must be present per tech-spec §S11
 * cache / indexing posture.
 */
export function generateMetadata(): Metadata {
  return {
    robots: { index: false, follow: false },
  };
}

type PageProps = {
  params: Promise<{ token: string }>;
};

/**
 * Async I/O glue for the recipient-facing share surface. The testable logic
 * is in `resolveShare(token, now)` — this page does no per-arm reasoning;
 * it just reads the resolver's single signal and renders one of two
 * surfaces.
 *
 * Response headers (`Cache-Control: no-store, private`,
 * `X-Robots-Tag: noindex, nofollow`) come from `middleware.ts` matched on
 * `/share/*`, not from this file — Server Components in Next.js 16 cannot
 * set outgoing response headers (per
 * `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/headers.md`
 * "Since `headers` is read-only, you cannot `set` or `delete` the outgoing
 * request headers"). Header parity across all four arms is structural —
 * the middleware matches on pathname, not on resolver outcome.
 */
export default async function SharePage({ params }: PageProps) {
  const { token } = await params;
  const snapshot = await resolveShare(token, nowUtc());
  if (snapshot === null) {
    return <ShareUnavailable />;
  }
  return <SharedStatementView snapshot={snapshot} />;
}
