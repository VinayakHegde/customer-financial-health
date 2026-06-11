import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  ClipboardList,
  History as HistoryIcon,
  Info,
  Minus,
  PencilLine,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { formatMoney } from "../lib/affordability/format";
import type {
  AffordabilityOutcome,
  Band,
  CountryCode,
  Currency,
  Delta,
  OutcomeCopy,
} from "../lib/affordability/types";
import { personaFirstName } from "../lib/personas";
import { FramingNotice } from "./FramingNotice";
import { ShareSnapshotForm } from "./ShareSnapshotForm";
import { SupportSignpost } from "./SupportSignpost";

export type DashboardViewProps = {
  personaLabel: string;
  outcome: AffordabilityOutcome;
  copy: OutcomeCopy;
  delta: Delta;
  /**
   * The id of the latest snapshot, if any. Used to seed the share-link form
   * so the customer can mint a 24-hour share link for the displayed
   * outcome. Null when no snapshot has been submitted yet (no-data persona).
   */
  latestSnapshotId?: string | null;
  /**
   * Currency + country_code threaded through to `formatMoney`. Optional so
   * the no-data persona (no stored snapshot) can render without a snapshot
   * lookup; defaults match the MVP's only-locale-shipped (`GBP` / `GB`).
   * S12 made these load-bearing — T73 asserts the dashboard's rendered
   * money strings match the PDF's `formatMoney` output verbatim.
   */
  currency?: Currency;
  countryCode?: CountryCode;
};

const SNAPSHOT_HEADING_ID = "snapshot-heading";
const REASONS_HEADING_ID = "reasons-heading";
const DELTA_HEADING_ID = "delta-heading";

function formatSignedDisposable(
  pence: number,
  currency: Currency,
  countryCode: CountryCode,
): string {
  if (pence > 0) {
    return `+${formatMoney(pence, currency, countryCode)}`;
  }
  if (pence < 0) {
    return `−${formatMoney(Math.abs(pence), currency, countryCode)}`;
  }
  return formatMoney(0, currency, countryCode);
}

function formatSignedDelta(
  pence: number,
  currency: Currency,
  countryCode: CountryCode,
): string {
  if (pence > 0) {
    return `+${formatMoney(pence, currency, countryCode)}`;
  }
  if (pence < 0) {
    return `−${formatMoney(Math.abs(pence), currency, countryCode)}`;
  }
  return formatMoney(0, currency, countryCode);
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

function BandChangeIcon({
  bandChange,
}: {
  bandChange: "improved" | "worsened" | "unchanged";
}) {
  if (bandChange === "improved") {
    return (
      <ArrowUpRight aria-hidden="true" className="h-4 w-4 text-foreground" />
    );
  }
  if (bandChange === "worsened") {
    return (
      <ArrowDownRight aria-hidden="true" className="h-4 w-4 text-foreground" />
    );
  }
  return <Minus aria-hidden="true" className="h-4 w-4 text-muted" />;
}

function DeltaPanel({
  delta,
  currency,
  countryCode,
}: {
  delta: Delta;
  currency: Currency;
  countryCode: CountryCode;
}) {
  if (delta.kind === "no-snapshot") {
    return (
      <p>
        Once you submit your income and outgoings, we&apos;ll show how your
        position changes over time.
      </p>
    );
  }

  if (delta.kind === "first-snapshot") {
    return (
      <p>
        This is your first snapshot — we&apos;ll show how your position changes
        once you submit again.
      </p>
    );
  }

  const changeAmount = formatSignedDelta(
    delta.disposableDeltaPence,
    currency,
    countryCode,
  );
  const previousDate = formatSnapshotDate(delta.previousTakenAt);

  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span>
        Your disposable income has changed by {changeAmount} since{" "}
        {previousDate}
        {"; "}your band is {delta.bandChange}.
      </span>
      <span
        aria-hidden="true"
        className="inline-flex items-center motion-reduce:transition-none"
      >
        <BandChangeIcon bandChange={delta.bandChange} />
      </span>
    </p>
  );
}

function SnapshotMetric({
  label,
  value,
  icon,
  emphasis,
  testId,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  emphasis?: boolean;
  testId?: string;
}) {
  return (
    <div
      data-testid={testId}
      className={`rounded-xl border ${
        emphasis
          ? "border-border-strong bg-surface"
          : "border-border bg-surface-muted"
      } p-4`}
    >
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
        {icon}
        <span>{label}</span>
      </div>
      <p
        className={`mt-2 ${
          emphasis ? "text-2xl" : "text-xl"
        } font-semibold tabular-nums text-foreground`}
      >
        {value}
      </p>
    </div>
  );
}

export function DashboardView({
  personaLabel,
  outcome,
  copy,
  delta,
  latestSnapshotId = null,
  currency = "GBP",
  countryCode = "GB",
}: DashboardViewProps) {
  const showFinancialSummary = outcome.state !== "no-data";
  const band = outcome.band;
  const firstName = personaFirstName(personaLabel);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-10">
      <section
        aria-labelledby={SNAPSHOT_HEADING_ID}
        className="fade-in-up rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            This month&apos;s snapshot
          </p>
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

        {/* TECH_SPEC §S4 bullet 1 split:
            • Persona name → rendered inside the View by the greeting below.
            • "Switch persona" affordance → owned by the global `<AppHeader />`
              (which calls the same `switchPersona` Server Action). Carrying it
              twice on the same page was real duplication (user feedback,
              D-123). The §S4 amendment that records this re-split is queued
              in `DECISIONS.md` "What is next". */}
        <p className="mt-2 text-sm text-muted">
          Hello,{" "}
          <span className="font-medium text-foreground">{firstName}</span>.
        </p>
        <h1
          id={SNAPSHOT_HEADING_ID}
          className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
        >
          {copy.headline}
        </h1>

        {showFinancialSummary && (
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <SnapshotMetric
              label="Total income"
              value={formatMoney(
                outcome.totalIncomePence,
                currency,
                countryCode,
              )}
              icon={<Wallet aria-hidden="true" className="h-3.5 w-3.5" />}
            />
            <SnapshotMetric
              label="Total outgoings"
              value={formatMoney(
                outcome.totalExpenditurePence,
                currency,
                countryCode,
              )}
              icon={
                <ClipboardList aria-hidden="true" className="h-3.5 w-3.5" />
              }
            />
            <SnapshotMetric
              testId="disposable-income"
              label="Disposable income"
              value={formatSignedDisposable(
                outcome.disposableIncomePence,
                currency,
                countryCode,
              )}
              emphasis
              icon={<TrendingUp aria-hidden="true" className="h-3.5 w-3.5" />}
            />
          </div>
        )}

        {outcome.irregularIncomeNote && (
          <p className="mt-5 inline-flex items-start gap-2 rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground">
            <Info aria-hidden="true" className="mt-0.5 h-4 w-4 text-muted" />
            <span>{outcome.irregularIncomeNote}</span>
          </p>
        )}

        <nav
          aria-label="Dashboard actions"
          className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end"
        >
          {/* New-customer (no-data) state: "View past submissions" hidden
              because there are none, and the primary CTA reads "Add" instead
              of "Update" because the customer has no prior I&E to update. */}
          {!showFinancialSummary ? null : (
            <a
              href="/history"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              <HistoryIcon aria-hidden="true" className="h-4 w-4" />
              <span>View past submissions</span>
            </a>
          )}
          <a
            href="/dashboard/update"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            <PencilLine aria-hidden="true" className="h-4 w-4" />
            <span>
              {showFinancialSummary
                ? "Update my income & outgoings"
                : "Add my income & outgoings"}
            </span>
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </a>
        </nav>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section
          aria-labelledby={REASONS_HEADING_ID}
          className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6"
        >
          <h2
            id={REASONS_HEADING_ID}
            className="flex items-center gap-2 text-base font-semibold text-foreground"
          >
            <Info aria-hidden="true" className="h-4 w-4 text-muted" />
            <span>Why this result</span>
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-foreground">
            {outcome.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby={DELTA_HEADING_ID}
          className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6"
        >
          <h2
            id={DELTA_HEADING_ID}
            className="flex items-center gap-2 text-base font-semibold text-foreground"
          >
            <TrendingUp aria-hidden="true" className="h-4 w-4 text-muted" />
            <span>How you&apos;ve changed</span>
          </h2>
          <div className="mt-3 text-sm leading-relaxed text-foreground">
            <DeltaPanel
              delta={delta}
              currency={currency}
              countryCode={countryCode}
            />
          </div>
        </section>
      </div>

      {latestSnapshotId !== null && (
        <div className="mt-6">
          <ShareSnapshotForm snapshotId={latestSnapshotId} />
        </div>
      )}

      <div className="mt-6">
        <SupportSignpost state={outcome.state} />
      </div>

      <FramingNotice />
    </main>
  );
}
