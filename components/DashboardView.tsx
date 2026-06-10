import { formatPounds } from "../lib/affordability/format";
import type {
  AffordabilityOutcome,
  Band,
  Delta,
  OutcomeCopy,
} from "../lib/affordability/types";
import { FramingNotice } from "./FramingNotice";
import { SupportSignpost } from "./SupportSignpost";

export type DashboardViewProps = {
  personaLabel: string;
  outcome: AffordabilityOutcome;
  copy: OutcomeCopy;
  delta: Delta;
};

const REASONS_HEADING_ID = "reasons-heading";
const DELTA_HEADING_ID = "delta-heading";

function formatSignedDisposable(pence: number): string {
  if (pence > 0) {
    return `+${formatPounds(pence)}`;
  }
  if (pence < 0) {
    return `−${formatPounds(Math.abs(pence))}`;
  }
  return formatPounds(0);
}

function formatSignedDelta(pence: number): string {
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

function DeltaPanel({ delta }: { delta: Delta }) {
  if (delta.kind === "first-snapshot") {
    return (
      <p>
        This is your first snapshot — we&apos;ll show how your position changes
        once you submit again.
      </p>
    );
  }

  const changeAmount = formatSignedDelta(delta.disposableDeltaPence);
  const previousDate = formatSnapshotDate(delta.previousTakenAt);

  return (
    <p>
      Your disposable income has changed by {changeAmount} since {previousDate}
      {"; "}
      your band is {delta.bandChange}.
      <span
        aria-hidden="true"
        className="ml-2 inline-block motion-reduce:transition-none"
      >
        {delta.bandChange === "improved"
          ? "↑"
          : delta.bandChange === "worsened"
            ? "↓"
            : "→"}
      </span>
    </p>
  );
}

export function DashboardView({
  personaLabel,
  outcome,
  copy,
  delta,
}: DashboardViewProps) {
  const showFinancialSummary = outcome.state !== "no-data";
  const band = outcome.band;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-sm text-foreground">{personaLabel}</p>
        <a
          href="/"
          className="text-sm font-medium text-foreground underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          Switch persona
        </a>
      </header>

      <h1 className="text-2xl font-semibold text-foreground">
        {copy.headline}
      </h1>

      {showFinancialSummary && (
        <p
          data-testid="disposable-income"
          className="mt-4 text-lg text-foreground"
        >
          Disposable income this month:{" "}
          <span className="font-medium">
            {formatSignedDisposable(outcome.disposableIncomePence)}
          </span>
        </p>
      )}

      {band !== null && (
        <span
          data-testid="band-chip"
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-foreground px-3 py-1 text-sm font-medium text-foreground"
        >
          <span aria-hidden="true">{bandChipLabel(band).icon}</span>
          <span>{bandChipLabel(band).text}</span>
        </span>
      )}

      {outcome.irregularIncomeNote && (
        <p className="mt-4 text-sm text-foreground">
          {outcome.irregularIncomeNote}
        </p>
      )}

      <section
        aria-labelledby={REASONS_HEADING_ID}
        className="mt-8 rounded-lg border border-foreground/15 p-4"
      >
        <h2
          id={REASONS_HEADING_ID}
          className="text-base font-semibold text-foreground"
        >
          Why this result
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-foreground">
          {outcome.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby={DELTA_HEADING_ID}
        className="mt-6 rounded-lg border border-foreground/15 p-4"
      >
        <h2
          id={DELTA_HEADING_ID}
          className="text-base font-semibold text-foreground"
        >
          How you&apos;ve changed
        </h2>
        <div className="mt-3 text-sm leading-relaxed text-foreground">
          <DeltaPanel delta={delta} />
        </div>
      </section>

      <div className="mt-6">
        <SupportSignpost state={outcome.state} />
      </div>

      <FramingNotice />

      <nav
        aria-label="Dashboard actions"
        className="mt-8 flex flex-col gap-3 sm:flex-row"
      >
        <a
          href="/dashboard/update"
          className="inline-flex min-h-6 min-w-6 items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          Update my income &amp; outgoings
        </a>
        <a
          href="/history"
          className="inline-flex min-h-6 min-w-6 items-center justify-center rounded-md border border-foreground px-4 py-2 text-sm font-medium text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          View past submissions
        </a>
      </nav>
    </main>
  );
}
