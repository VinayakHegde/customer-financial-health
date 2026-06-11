import type { CountryCode, Currency, Money } from "./types";

/** Format integer pence as a whole-pound £ string for customer-visible copy. */
export function formatPounds(pence: Money): string {
  const pounds = pence / 100;
  if (Number.isInteger(pounds)) {
    return `£${pounds.toLocaleString("en-GB")}`;
  }
  return `£${pounds.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

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
