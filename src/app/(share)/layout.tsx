import { Wallet } from "lucide-react";
import { shareWordmark } from "../../../lib/share/copy";

/**
 * Layout for the recipient-facing share surfaces under `/share/*`.
 *
 * Deliberately minimal: a sectioned `<header>` with the product wordmark and
 * nothing else. The persona-aware header component lives only in
 * `(main)/layout.tsx` — the recipient is not the persona who owns the
 * snapshot (they may not even have a persona cookie), and exposing
 * persona-aware navigation here would (a) leak which persona owns the
 * snapshot if the recipient also has a cookie set for a different persona,
 * (b) tempt the recipient into routes they have no right to act on.
 *
 * Per tech-spec §S11 F1.8 — route-group / layout separation is the only
 * acceptable enforcement shape. The conditional-render alternative was
 * rejected because it leaves a behavioural seam.
 */
export default function ShareLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3 sm:py-4">
          <span
            aria-hidden="true"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground"
          >
            <Wallet aria-hidden="true" className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold text-foreground">
            {shareWordmark}
          </span>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </>
  );
}
