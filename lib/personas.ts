import type { IncomeAndExpenditure, OutcomeState } from "./affordability/types";

export type Persona = {
  id: string;
  label: string;
  startingIe: IncomeAndExpenditure;
  expectedOutcome: OutcomeState;
};

export const personas: Persona[] = [
  {
    id: "pat",
    label: "Pat — comfortable surplus",
    startingIe: {
      earners: [{ label: "Pat", amountPence: 320_000, cadence: "monthly" }],
      expenditure: [
        { label: "Rent", amountPence: 110_000 },
        { label: "Utilities", amountPence: 18_000 },
        { label: "Food", amountPence: 35_000 },
        { label: "Travel", amountPence: 12_000 },
        { label: "Subscriptions", amountPence: 5_000 },
      ],
    },
    expectedOutcome: "surplus",
  },
  {
    id: "sam",
    label: "Sam — small surplus near breakeven",
    startingIe: {
      earners: [{ label: "Sam", amountPence: 195_000, cadence: "monthly" }],
      expenditure: [
        { label: "Rent", amountPence: 95_000 },
        { label: "Utilities", amountPence: 16_000 },
        { label: "Food", amountPence: 32_000 },
        { label: "Travel", amountPence: 9_000 },
        { label: "Childcare", amountPence: 38_000 },
      ],
    },
    expectedOutcome: "surplus",
  },
  {
    id: "jordan",
    label: "Jordan — shortfall",
    startingIe: {
      earners: [{ label: "Jordan", amountPence: 165_000, cadence: "monthly" }],
      expenditure: [
        { label: "Rent", amountPence: 105_000 },
        { label: "Utilities", amountPence: 18_000 },
        { label: "Food", amountPence: 36_000 },
        { label: "Travel", amountPence: 12_000 },
        { label: "Loan", amountPence: 22_000 },
      ],
    },
    expectedOutcome: "shortfall",
  },
  {
    id: "alex",
    label: "Alex — zero income this month",
    startingIe: {
      earners: [{ label: "Alex", amountPence: 0, cadence: "monthly" }],
      expenditure: [
        { label: "Rent", amountPence: 90_000 },
        { label: "Utilities", amountPence: 15_000 },
        { label: "Food", amountPence: 28_000 },
      ],
    },
    expectedOutcome: "zero-income",
  },
  {
    id: "riley",
    label: "Riley — new customer",
    startingIe: {
      earners: [],
      expenditure: [],
    },
    expectedOutcome: "no-data",
  },
  {
    id: "casey",
    label: "Casey — irregular income (gig)",
    startingIe: {
      earners: [
        {
          label: "Casey",
          amountPence: 150_000,
          cadence: "monthly",
          variable: true,
        },
      ],
      expenditure: [
        { label: "Rent", amountPence: 80_000 },
        { label: "Utilities", amountPence: 14_000 },
        { label: "Food", amountPence: 30_000 },
        { label: "Travel", amountPence: 18_000 },
      ],
    },
    expectedOutcome: "surplus",
  },
  {
    id: "morgan-drew",
    label: "Morgan + Drew — joint household",
    startingIe: {
      earners: [
        { label: "Morgan", amountPence: 180_000, cadence: "monthly" },
        { label: "Drew", amountPence: 140_000, cadence: "monthly" },
      ],
      expenditure: [
        { label: "Rent", amountPence: 145_000 },
        { label: "Utilities", amountPence: 22_000 },
        { label: "Food", amountPence: 65_000 },
        { label: "Childcare", amountPence: 40_000 },
        { label: "Travel", amountPence: 18_000 },
      ],
    },
    expectedOutcome: "surplus",
  },
];

export function getPersonaById(id: string): Persona | undefined {
  return personas.find((persona) => persona.id === id);
}

/** Personas that receive a starting snapshot when the DB is first opened. */
export function getPersonasForSeeding(): Persona[] {
  return personas.filter((persona) => persona.id !== "riley");
}

/**
 * First name (or full label fallback) derived from a Persona.label like
 * "Pat — comfortable surplus" → "Pat". Used by the dashboard greeting and the
 * AppHeader persona chip — both surfaces must read the same name, so the
 * derivation lives here, not in either component.
 */
export function personaFirstName(label: string): string {
  const beforeDash = label.split("—")[0]?.trim() ?? label;
  return beforeDash.length > 0 ? beforeDash : label;
}
