import type { IncomeAndExpenditure } from "../../lib/affordability/types";

export const iePatSurplus: IncomeAndExpenditure = {
  earners: [{ label: "Pat", amountPence: 320_000, cadence: "monthly" }],
  expenditure: [
    { label: "Rent", amountPence: 110_000 },
    { label: "Utilities", amountPence: 18_000 },
    { label: "Food", amountPence: 35_000 },
    { label: "Travel", amountPence: 12_000 },
    { label: "Subscriptions", amountPence: 5_000 },
  ],
};

export const ieSamNearBreakeven: IncomeAndExpenditure = {
  earners: [{ label: "Sam", amountPence: 195_000, cadence: "monthly" }],
  expenditure: [
    { label: "Rent", amountPence: 95_000 },
    { label: "Utilities", amountPence: 16_000 },
    { label: "Food", amountPence: 32_000 },
    { label: "Travel", amountPence: 9_000 },
    { label: "Childcare", amountPence: 34_000 },
  ],
};

export const ieJordanShortfall: IncomeAndExpenditure = {
  earners: [{ label: "Jordan", amountPence: 165_000, cadence: "monthly" }],
  expenditure: [
    { label: "Rent", amountPence: 105_000 },
    { label: "Utilities", amountPence: 18_000 },
    { label: "Food", amountPence: 36_000 },
    { label: "Travel", amountPence: 12_000 },
    { label: "Loan", amountPence: 22_000 },
  ],
};

export const ieAlexZeroIncome: IncomeAndExpenditure = {
  earners: [{ label: "Alex", amountPence: 0, cadence: "monthly" }],
  expenditure: [
    { label: "Rent", amountPence: 90_000 },
    { label: "Utilities", amountPence: 15_000 },
    { label: "Food", amountPence: 28_000 },
  ],
};

export const ieRileyNoData: IncomeAndExpenditure = {
  earners: [],
  expenditure: [],
};

export const ieCaseyIrregular: IncomeAndExpenditure = {
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
};

export const ieMorganDrewJoint: IncomeAndExpenditure = {
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
};

export const ieBreakevenExact: IncomeAndExpenditure = {
  earners: [{ label: "Taylor", amountPence: 200_000, cadence: "monthly" }],
  expenditure: [
    { label: "Rent", amountPence: 120_000 },
    { label: "Utilities", amountPence: 20_000 },
    { label: "Food", amountPence: 40_000 },
    { label: "Travel", amountPence: 20_000 },
  ],
};

export const ieNegativeAmount: IncomeAndExpenditure = {
  earners: [{ label: "Jordan", amountPence: -100, cadence: "monthly" }],
  expenditure: [],
};

export const ieNonNumericAmount = {
  earners: [
    { label: "Jordan", amountPence: "not-a-number", cadence: "monthly" },
  ],
  expenditure: [],
} as unknown as IncomeAndExpenditure;

export const ieOversizeLabel: IncomeAndExpenditure = {
  earners: [
    {
      label: "x".repeat(81),
      amountPence: 100_000,
      cadence: "monthly",
    },
  ],
  expenditure: [],
};

export const ieWhitespaceLabel: IncomeAndExpenditure = {
  earners: [{ label: "   ", amountPence: 100_000, cadence: "monthly" }],
  expenditure: [],
};

export const allIeFixtures: IncomeAndExpenditure[] = [
  iePatSurplus,
  ieSamNearBreakeven,
  ieJordanShortfall,
  ieAlexZeroIncome,
  ieRileyNoData,
  ieCaseyIrregular,
  ieMorganDrewJoint,
  ieBreakevenExact,
];
