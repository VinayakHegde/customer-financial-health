import { CalendarDays, ClipboardList, PencilLine, Wallet } from "lucide-react";
import { formatPounds } from "../lib/affordability/format";
import type { Band, OutcomeState, Snapshot } from "../lib/affordability/types";
import { BackToDashboardLink } from "./BackToDashboardLink";
import { FramingNotice } from "./FramingNotice";
import { ShareSnapshotForm } from "./ShareSnapshotForm";
import { SupportSignpost } from "./SupportSignpost";

export type HistoryListProps = {
  snapshots: Snapshot[];
};

const PAGE_TITLE_ID = "history-page-title";

function formatSignedDisposable(pence: number): string {
  if (pence > 0) {
    return `+${formatPounds(pence)}`;
  }
  if (pence < 0) {
    return `−${formatPounds(Math.abs(pence))}`;
  }
  return formatPounds(0);
}

function formatSnapshotDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const RELATIVE_THRESHOLDS: {
  limit: number;
  unit: Intl.RelativeTimeFormatUnit;
}[] = [
  { limit: 60, unit: "second" },
  { limit: 60 * 60, unit: "minute" },
  { limit: 60 * 60 * 24, unit: "hour" },
  { limit: 60 * 60 * 24 * 30, unit: "day" },
  { limit: 60 * 60 * 24 * 365, unit: "month" },
  { limit: Number.POSITIVE_INFINITY, unit: "year" },
];

function formatRelativePhrase(iso: string, now: Date): string {
  const formatter = new Intl.RelativeTimeFormat("en-GB", { numeric: "auto" });
  const diffSeconds = Math.round(
    (new Date(iso).getTime() - now.getTime()) / 1000,
  );
  const absSeconds = Math.abs(diffSeconds);

  for (let index = 0; index < RELATIVE_THRESHOLDS.length; index += 1) {
    const { limit, unit } = RELATIVE_THRESHOLDS[index];
    if (absSeconds < limit) {
      const previous = index === 0 ? 1 : RELATIVE_THRESHOLDS[index - 1].limit;
      const value = Math.round(diffSeconds / previous);
      return formatter.format(value, unit);
    }
  }
  return formatter.format(0, "second");
}

function bandChipLabel(band: Band): { text: string; icon: string } {
  switch (band) {
    case "surplus":
      return { text: "Surplus", icon: "↑" };
    case "breakeven":
      return { text: "Breakeven", icon: "→" };
    case "shortfall":
      return { text: "Shortfall", icon: "↓" };
  }
}

function outcomeStateLabel(state: OutcomeState): string {
  switch (state) {
    case "surplus":
      return "Surplus";
    case "breakeven":
      return "Breakeven";
    case "shortfall":
      return "Shortfall";
    case "zero-income":
      return "No income recorded";
    case "no-data":
      return "No data yet";
  }
}

function IeBreakdown({ snapshot }: { snapshot: Snapshot }) {
  const { earners, expenditure } = snapshot.ie;
  const incomeHeadingId = `snapshot-${snapshot.id}-income`;
  const outgoingsHeadingId = `snapshot-${snapshot.id}-outgoings`;

  return (
    <div className="mt-3 grid gap-4 text-sm text-foreground sm:grid-cols-2">
      <section
        aria-labelledby={incomeHeadingId}
        className="rounded-lg border border-border bg-surface-muted p-3"
      >
        <h3
          id={incomeHeadingId}
          className="flex items-center gap-2 text-sm font-semibold text-foreground"
        >
          <Wallet aria-hidden="true" className="h-3.5 w-3.5 text-muted" />
          <span>Income</span>
        </h3>
        {earners.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No income recorded.</p>
        ) : (
          <dl className="mt-2 grid gap-1 sm:grid-cols-[minmax(0,1fr)_auto]">
            {earners.map((earner, index) => (
              <div
                key={`${snapshot.id}-earner-${index}-${earner.label}`}
                className="contents"
              >
                <dt className="text-sm text-foreground">{earner.label}</dt>
                <dd className="text-sm font-medium tabular-nums sm:text-right">
                  {formatPounds(earner.amountPence)}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </section>
      <section
        aria-labelledby={outgoingsHeadingId}
        className="rounded-lg border border-border bg-surface-muted p-3"
      >
        <h3
          id={outgoingsHeadingId}
          className="flex items-center gap-2 text-sm font-semibold text-foreground"
        >
          <ClipboardList
            aria-hidden="true"
            className="h-3.5 w-3.5 text-muted"
          />
          <span>Outgoings</span>
        </h3>
        {expenditure.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No outgoings recorded.</p>
        ) : (
          <dl className="mt-2 grid gap-1 sm:grid-cols-[minmax(0,1fr)_auto]">
            {expenditure.map((line, index) => (
              <div
                key={`${snapshot.id}-expenditure-${index}-${line.label}`}
                className="contents"
              >
                <dt className="text-sm text-foreground">{line.label}</dt>
                <dd className="text-sm font-medium tabular-nums sm:text-right">
                  {formatPounds(line.amountPence)}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </section>
    </div>
  );
}

function SnapshotRow({ snapshot, now }: { snapshot: Snapshot; now: Date }) {
  const { outcome } = snapshot;
  const formattedDate = formatSnapshotDate(snapshot.takenAt);
  const relativePhrase = formatRelativePhrase(snapshot.takenAt, now);
  const showFinancialSummary = outcome.state !== "no-data";
  const band = outcome.band;
  const timeId = `snapshot-${snapshot.id}-time`;
  const stateLabelId = `snapshot-${snapshot.id}-state`;

  return (
    <li
      aria-labelledby={`${timeId} ${stateLabelId}`}
      className="relative rounded-2xl border border-border bg-surface p-5 shadow-sm transition-colors sm:p-6"
    >
      <span
        aria-hidden="true"
        className="absolute left-5 top-6 hidden h-2 w-2 -translate-x-1/2 rounded-full bg-border-strong sm:block"
      />
      <div className="flex flex-wrap items-baseline justify-between gap-3 sm:pl-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
            <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" />
            <span>Snapshot</span>
          </div>
          <time
            id={timeId}
            dateTime={snapshot.takenAt}
            className="mt-1 block text-sm font-semibold text-foreground"
          >
            {formattedDate}{" "}
            <span className="font-normal text-muted">({relativePhrase})</span>
          </time>
        </div>
        <span
          id={stateLabelId}
          data-testid="outcome-state-label"
          className="inline-flex items-center rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-medium text-foreground"
        >
          {outcomeStateLabel(outcome.state)}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 sm:pl-3">
        {showFinancialSummary && (
          <p
            data-testid="disposable-income"
            className="text-sm text-foreground"
          >
            Disposable income:{" "}
            <span className="font-semibold tabular-nums">
              {formatSignedDisposable(outcome.disposableIncomePence)}
            </span>
          </p>
        )}
        {band !== null && (
          <span
            data-testid="band-chip"
            className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface-muted px-3 py-1 text-xs font-medium text-foreground"
          >
            <span aria-hidden="true">{bandChipLabel(band).icon}</span>
            <span>{bandChipLabel(band).text}</span>
          </span>
        )}
      </div>

      <details className="mt-4 sm:pl-3">
        <summary className="inline-flex min-h-6 min-w-6 cursor-pointer items-center gap-1.5 rounded-md text-sm font-medium text-foreground underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
          Show what was submitted on {formattedDate}
        </summary>
        <IeBreakdown snapshot={snapshot} />
      </details>

      <div className="mt-4 sm:pl-3">
        <ShareSnapshotForm snapshotId={snapshot.id} />
      </div>
    </li>
  );
}

export function HistoryList({ snapshots }: HistoryListProps) {
  const now = new Date();

  if (snapshots.length === 0) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
        <BackToDashboardLink />

        <header className="fade-in-up mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Your history
          </p>
          <h1
            id={PAGE_TITLE_ID}
            className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
          >
            Past submissions
          </h1>
        </header>

        <section
          aria-labelledby={PAGE_TITLE_ID}
          className="mt-6 rounded-2xl border border-border bg-surface p-6 shadow-sm"
        >
          <p className="text-sm text-foreground">
            No submissions yet — add your first one to start your history.
          </p>
          <a
            href="/dashboard/update"
            className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            <PencilLine aria-hidden="true" className="h-4 w-4" />
            <span>Add your first submission</span>
          </a>
        </section>

        <div className="mt-6">
          <SupportSignpost state="no-data" />
        </div>

        <FramingNotice />
      </main>
    );
  }

  const latestState = snapshots[0].outcome.state;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
      <BackToDashboardLink />

      <header className="fade-in-up mt-4 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Your history
          </p>
          <h1
            id={PAGE_TITLE_ID}
            className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
          >
            Past submissions
          </h1>
        </div>
        <p className="text-xs text-muted">
          {snapshots.length} {snapshots.length === 1 ? "snapshot" : "snapshots"}{" "}
          on record
        </p>
      </header>

      <ol
        aria-labelledby={PAGE_TITLE_ID}
        className="mt-6 space-y-4 sm:border-l sm:border-border sm:pl-4"
      >
        {snapshots.map((snapshot) => (
          <SnapshotRow key={snapshot.id} snapshot={snapshot} now={now} />
        ))}
      </ol>

      <div className="mt-6">
        <SupportSignpost state={latestState} />
      </div>

      <FramingNotice />
    </main>
  );
}
