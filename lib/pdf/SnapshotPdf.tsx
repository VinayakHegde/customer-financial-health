import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { getCopyForOutcome } from "../affordability/copy";
import { formatMoney } from "../affordability/format";
import { framingNotice } from "../affordability/framing";
import type { Band, CountryCode, Snapshot } from "../affordability/types";

/**
 * S12 — PDF document for an owned snapshot.
 *
 * Sections (tech-spec §S12 design bullets 1–12, top to bottom):
 *   1. Lightweight branding wordmark (no logo image).
 *   2. Snapshot date (Intl.DateTimeFormat, UTC).
 *   3. Currency / country line.
 *   4. Income total (`formatMoney`).
 *   5. Expenditure total (`formatMoney`).
 *   6. Disposable income — uses `formatMoney` directly so its locale-native
 *      sign character (`-£280.00`) matches `formattedJordanDisposable`
 *      verbatim in T73's drift guard. Suppressed for `no-data`.
 *   7. Band — text-only label (`Surplus` / `Breakeven` / `Shortfall` /
 *      `Zero income` / `No data`). No coloured chip.
 *   8. Reasons — `outcome.reasons[]` as bulleted lines.
 *   9. Income breakdown — earner label + amount per row.
 *   10. Expenditure breakdown — line label + amount per row.
 *   11. Support signpost — copy block + `/support` URL as text (R7 broadening
 *       per tech-spec §S12; rendered as `<Text>` only — no JSX of the
 *       DOM `<SupportSignpost />`).
 *   12. Framing notice — `framingNotice()` body verbatim (R20 broadening).
 *
 * No image assets, no embedded fonts, no client-side React-PDF primitives.
 * The component is pure props-in / `<Document>`-out so `renderToBuffer`
 * can drive it from a Node Route Handler.
 */
const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 11, lineHeight: 1.45 },
  wordmark: { fontSize: 9, color: "#666", marginBottom: 4 },
  heading: { fontSize: 16, marginBottom: 12, fontWeight: 700 },
  sectionHeading: { fontSize: 14, marginTop: 16, marginBottom: 6 },
  paragraph: { marginBottom: 4 },
  metaLine: { marginBottom: 2, color: "#444" },
  bullet: { marginBottom: 2 },
  rowLabel: { marginBottom: 2 },
});

const localeByCountryCode: Record<CountryCode, string> = {
  GB: "en-GB",
};

function bandLabel(band: Band | null): string {
  if (band === null) {
    return "No data";
  }
  switch (band) {
    case "surplus":
      return "Surplus";
    case "breakeven":
      return "Breakeven";
    case "shortfall":
      return "Shortfall";
  }
}

function stateBandLabel(snapshot: Snapshot): string {
  if (snapshot.outcome.state === "zero-income") {
    return "Zero income";
  }
  return bandLabel(snapshot.outcome.band);
}

function formatDate(iso: string, countryCode: CountryCode): string {
  const locale = localeByCountryCode[countryCode];
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(iso));
}

export type SnapshotPdfProps = { snapshot: Snapshot };

export function SnapshotPdf({ snapshot }: SnapshotPdfProps) {
  const { outcome, ie, currency, countryCode } = snapshot;
  const copy = getCopyForOutcome(outcome.state);
  const framing = framingNotice();
  const showFinancials = outcome.state !== "no-data";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.wordmark}>
          Customer Financial Health · Snapshot
        </Text>
        <Text style={styles.heading}>{copy.headline}</Text>

        <Text style={styles.metaLine}>
          Snapshot date: {formatDate(snapshot.takenAt, countryCode)}
        </Text>
        <Text style={styles.metaLine}>
          Currency: {currency} · Country: {countryCode}
        </Text>

        {showFinancials && (
          <View>
            <Text style={styles.sectionHeading}>Totals</Text>
            <Text style={styles.paragraph}>
              Total income:{" "}
              {formatMoney(outcome.totalIncomePence, currency, countryCode)}
            </Text>
            <Text style={styles.paragraph}>
              Total outgoings:{" "}
              {formatMoney(
                outcome.totalExpenditurePence,
                currency,
                countryCode,
              )}
            </Text>
            <Text style={styles.paragraph}>
              Disposable income:{" "}
              {formatMoney(
                outcome.disposableIncomePence,
                currency,
                countryCode,
              )}
            </Text>
          </View>
        )}

        <Text style={styles.sectionHeading}>Band</Text>
        <Text style={styles.paragraph}>{stateBandLabel(snapshot)}</Text>

        {outcome.reasons.length > 0 && (
          <View>
            <Text style={styles.sectionHeading}>Why this result</Text>
            {outcome.reasons.map((reason) => (
              <Text key={reason} style={styles.bullet}>
                • {reason}
              </Text>
            ))}
          </View>
        )}

        {outcome.irregularIncomeNote && (
          <Text style={styles.paragraph}>{outcome.irregularIncomeNote}</Text>
        )}

        {showFinancials && ie.earners.length > 0 && (
          <View>
            <Text style={styles.sectionHeading}>Income</Text>
            {ie.earners.map((earner, index) => (
              <Text
                key={`earner-${index}-${earner.label}`}
                style={styles.rowLabel}
              >
                {earner.label}:{" "}
                {formatMoney(earner.amountPence, currency, countryCode)}
              </Text>
            ))}
          </View>
        )}

        {showFinancials && ie.expenditure.length > 0 && (
          <View>
            <Text style={styles.sectionHeading}>Outgoings</Text>
            {ie.expenditure.map((line, index) => (
              <Text key={`line-${index}-${line.label}`} style={styles.rowLabel}>
                {line.label}:{" "}
                {formatMoney(line.amountPence, currency, countryCode)}
              </Text>
            ))}
          </View>
        )}

        <Text style={styles.sectionHeading}>Support</Text>
        <Text style={styles.paragraph}>{copy.supportSignpost.message}</Text>
        <Text style={styles.paragraph}>
          {copy.supportSignpost.label}: {copy.supportSignpost.href}
        </Text>

        <Text style={styles.sectionHeading}>{framing.headline}</Text>
        <Text style={styles.paragraph}>{framing.body}</Text>
      </Page>
    </Document>
  );
}
