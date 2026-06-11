import { ClipboardList, Info, TrendingUp, Wallet } from "lucide-react";
import { getCopyForOutcome } from "../lib/affordability/copy";
import { formatMoney } from "../lib/affordability/format";
import type { Band, Snapshot } from "../lib/affordability/types";
import { FramingNotice } from "./FramingNotice";
import { SupportSignpost } from "./SupportSignpost";

/**
 * Read-only outcome surface for a snapshot recipient (S11).
 *
 * Sync, props-only — no AppHeader import, no persona-aware navigation, no
 * persona name. Renders the same disposable / band / reasons / breakdown
 * shape that `<DashboardView />` does, plus the framing notice and support
 * signpost (R20 + R7 broadening per tech-spec §S11 — recipient is exactly
 * the audience these surfaces are written for).
 *
 * Money strings flow through `formatMoney(pence, snapshot.currency,
 * snapshot.countryCode)` so the recipient sees locale-correct amounts.
 */
export type SharedStatementViewProps = {
  snapshot: Snapshot;
};

const SNAPSHOT_HEADING_ID = "shared-snapshot-heading";
const REASONS_HEADING_ID = "shared-reasons-heading";
const BREAKDOWN_HEADING_ID = "shared-breakdown-heading";

function formatSignedMoney(pence: number, snapshot: Snapshot): string {
  const absolute = formatMoney(
    Math.abs(pence),
    snapshot.currency,
    snapshot.countryCode,
  );
  if (pence > 0) {
    return `+${absolute}`;
  }
  if (pence < 0) {
    return `−${absolute}`;
  }
  return formatMoney(0, snapshot.currency, snapshot.countryCode);
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

function SharedMetric({
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

export function SharedStatementView({ snapshot }: SharedStatementViewProps) {
  const { outcome, ie } = snapshot;
  const copy = getCopyForOutcome(outcome.state);
  const showFinancialSummary = outcome.state !== "no-data";
  const band = outcome.band;
  const incomeHeadingId = `shared-${snapshot.id}-income`;
  const outgoingsHeadingId = `shared-${snapshot.id}-outgoings`;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-10">
      <section
        aria-labelledby={SNAPSHOT_HEADING_ID}
        className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Shared snapshot
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
        <h1
          id={SNAPSHOT_HEADING_ID}
          className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
        >
          {copy.headline}
        </h1>

        {showFinancialSummary && (
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <SharedMetric
              label="Total income"
              value={formatMoney(
                outcome.totalIncomePence,
                snapshot.currency,
                snapshot.countryCode,
              )}
              icon={<Wallet aria-hidden="true" className="h-3.5 w-3.5" />}
            />
            <SharedMetric
              label="Total outgoings"
              value={formatMoney(
                outcome.totalExpenditurePence,
                snapshot.currency,
                snapshot.countryCode,
              )}
              icon={
                <ClipboardList aria-hidden="true" className="h-3.5 w-3.5" />
              }
            />
            <SharedMetric
              testId="disposable-income"
              label="Disposable income"
              value={formatSignedMoney(outcome.disposableIncomePence, snapshot)}
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
      </section>

      <section
        aria-labelledby={REASONS_HEADING_ID}
        className="mt-6 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6"
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
        aria-labelledby={BREAKDOWN_HEADING_ID}
        className="mt-6 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6"
      >
        <h2
          id={BREAKDOWN_HEADING_ID}
          className="flex items-center gap-2 text-base font-semibold text-foreground"
        >
          <ClipboardList aria-hidden="true" className="h-4 w-4 text-muted" />
          <span>What was submitted</span>
        </h2>
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
            {ie.earners.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No income recorded.</p>
            ) : (
              <dl className="mt-2 grid gap-1 sm:grid-cols-[minmax(0,1fr)_auto]">
                {ie.earners.map((earner, index) => (
                  <div
                    key={`${snapshot.id}-earner-${index}-${earner.label}`}
                    className="contents"
                  >
                    <dt className="text-sm text-foreground">{earner.label}</dt>
                    <dd className="text-sm font-medium tabular-nums sm:text-right">
                      {formatMoney(
                        earner.amountPence,
                        snapshot.currency,
                        snapshot.countryCode,
                      )}
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
            {ie.expenditure.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No outgoings recorded.</p>
            ) : (
              <dl className="mt-2 grid gap-1 sm:grid-cols-[minmax(0,1fr)_auto]">
                {ie.expenditure.map((line, index) => (
                  <div
                    key={`${snapshot.id}-expenditure-${index}-${line.label}`}
                    className="contents"
                  >
                    <dt className="text-sm text-foreground">{line.label}</dt>
                    <dd className="text-sm font-medium tabular-nums sm:text-right">
                      {formatMoney(
                        line.amountPence,
                        snapshot.currency,
                        snapshot.countryCode,
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
        </div>
      </section>

      <div className="mt-6">
        <SupportSignpost state={outcome.state} />
      </div>

      <FramingNotice />
    </main>
  );
}
