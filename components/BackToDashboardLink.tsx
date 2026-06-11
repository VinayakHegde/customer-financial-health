import { ArrowLeft } from "lucide-react";

/**
 * Small navigational affordance used at the top of any non-`/dashboard`
 * customer-facing route that needs a "back" path to the affordability surface.
 * Shared between `<HistoryList />` (top of both empty and populated states) and
 * `<UpdateForm />` (above the page header) so future polish only changes one
 * file. Plain `<a>` (no `next/link`) for consistency with the rest of the
 * polish; the route is a thin Server Component, so a full request is fine.
 */
export function BackToDashboardLink() {
  return (
    <a
      href="/dashboard"
      className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
    >
      <ArrowLeft aria-hidden="true" className="h-4 w-4" />
      <span>Back to dashboard</span>
    </a>
  );
}
