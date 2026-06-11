import type { CountryCode, Currency, Money } from "./types";

const localeByCountryCode: Record<CountryCode, string> = {
  GB: "en-GB",
};

/**
 * Locale-aware money formatter for outcome surfaces. The `pence / 100` divide
 * is display-only; all affordability arithmetic upstream stays in integer
 * pence (per tech-spec §S10 integer-pence invariant).
 */
export function formatMoney(
  pence: Money,
  currency: Currency,
  countryCode: CountryCode,
): string {
  const locale = localeByCountryCode[countryCode];
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(pence / 100);
}

/**
 * GBP-denominated £ string for currency-agnostic call sites (the affordability
 * calculator's `reasons[]`, which doesn't carry a currency / countryCode and
 * pre-MVP is GBP-only). Delegates to `formatMoney(_, 'GBP', 'GB')` so dashboard
 * headline numbers and reason strings stay byte-for-byte identical, and the
 * tech-spec §S10 source-discipline rule ("no `*Pence / 100` outside
 * `formatMoney`") holds for this helper too.
 */
export function formatPounds(pence: Money): string {
  return formatMoney(pence, "GBP", "GB");
}
