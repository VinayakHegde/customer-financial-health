export type Money = number;

export type EarnerIncome = {
  label: string;
  amountPence: Money;
  cadence: "monthly";
  variable?: boolean;
};

export type ExpenditureLine = {
  label: string;
  amountPence: Money;
};

export type IncomeAndExpenditure = {
  earners: EarnerIncome[];
  expenditure: ExpenditureLine[];
};

export type Band = "surplus" | "breakeven" | "shortfall";

export type OutcomeState =
  | "surplus"
  | "breakeven"
  | "shortfall"
  | "zero-income"
  | "no-data";

export type AffordabilityOutcome = {
  state: OutcomeState;
  band: Band | null;
  totalIncomePence: Money;
  totalExpenditurePence: Money;
  disposableIncomePence: Money;
  reasons: string[];
  irregularIncomeNote?: string;
};

export type Snapshot = {
  id: string;
  customerId: string;
  takenAt: string;
  ie: IncomeAndExpenditure;
  outcome: AffordabilityOutcome;
};

export type Delta =
  | { kind: "no-snapshot" }
  | { kind: "first-snapshot" }
  | {
      kind: "change";
      disposableDeltaPence: Money;
      bandChange: "improved" | "worsened" | "unchanged";
      previousTakenAt: string;
    };

export type ValidationError = { field: string; message: string };

export type SupportSignpostCopy = {
  href: string;
  label: string;
  message: string;
};

export type OutcomeCopy = {
  headline: string;
  body: string;
  supportSignpost: SupportSignpostCopy;
};

export type FramingCopy = {
  headline: string;
  body: string;
  supportLink: { href: "/support"; label: string };
};
