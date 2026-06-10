import type { Money } from "./types";

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
