import { LinkIcon } from "lucide-react";
import {
  shareUnavailableBody,
  shareUnavailableHeading,
} from "../lib/share/copy";

const HEADING_ID = "share-unavailable-heading";

/**
 * Single sectioned page rendered for every resolver miss arm — unknown
 * token, expired token, snapshot-row-missing.
 *
 * Carries no outcome state, so neither R20 (`<FramingNotice />`) nor R7
 * (`<SupportSignpost />`) attaches — rendering them here would re-open the
 * gate-cross pattern S007 round-2 F2.1 closed when it narrowed those
 * commitments to outcome screens.
 *
 * The copy is identical regardless of which miss arm fired (the resolver
 * collapses all three to `null`); HTTP status 200 and the response headers
 * are also identical (set by `middleware.ts`). Same-response posture is
 * structural, not convention-based.
 */
export function ShareUnavailable() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
      <section
        aria-labelledby={HEADING_ID}
        className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8"
      >
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-muted ring-1 ring-border"
          >
            <LinkIcon aria-hidden="true" className="h-4 w-4" />
          </span>
          <div className="flex-1">
            <h1
              id={HEADING_ID}
              className="text-xl font-semibold text-foreground sm:text-2xl"
            >
              {shareUnavailableHeading}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-foreground">
              {shareUnavailableBody}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
