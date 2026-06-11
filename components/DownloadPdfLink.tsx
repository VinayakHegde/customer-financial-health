import { ArrowDownToLine } from "lucide-react";

/**
 * S12 — link to the per-snapshot PDF export Route Handler.
 *
 * Plain `<a href download rel="noopener">` — no client JS, no Server Action,
 * no client-side fetch. The browser handles the download natively via the
 * `Content-Disposition: attachment` header the Route Handler returns
 * (`src/app/(main)/dashboard/snapshot/[id]/pdf/route.ts`).
 *
 * Used inside `<DashboardView />` (latest snapshot) and `<HistoryList />`
 * (every owned snapshot row) per tech-spec §S12 "Where the download is
 * invoked from". Hit-target ≥ 24×24 satisfies WCAG SC 2.5.8 (cross-cutting
 * commitment in tech-spec §4).
 */
export type DownloadPdfLinkProps = { snapshotId: string };

export function DownloadPdfLink({ snapshotId }: DownloadPdfLinkProps) {
  const href = `/dashboard/snapshot/${encodeURIComponent(snapshotId)}/pdf`;
  return (
    <a
      href={href}
      download
      rel="noopener"
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
    >
      <ArrowDownToLine aria-hidden="true" className="h-4 w-4" />
      <span>Download PDF</span>
    </a>
  );
}
