import { formatPounds } from "./format";
import type {
  AffordabilityOutcome,
  Band,
  ExpenditureLine,
  IncomeAndExpenditure,
  Money,
  OutcomeState,
} from "./types";

function sumAmounts(lines: { amountPence: Money }[]): Money {
  return lines.reduce((total, line) => total + line.amountPence, 0);
}

function findLargestExpenditure(
  expenditure: ExpenditureLine[],
): ExpenditureLine | undefined {
  if (expenditure.length === 0) {
    return undefined;
  }
  return expenditure.reduce((largest, line) =>
    line.amountPence > largest.amountPence ? line : largest,
  );
}

function buildIrregularIncomeNote(
  ie: IncomeAndExpenditure,
): string | undefined {
  const hasVariableEarner = ie.earners.some(
    (earner) => earner.variable === true,
  );
  if (ie.earners.length === 0 || !hasVariableEarner) {
    return undefined;
  }
  return "Some of your income varies from month to month, so this picture may shift when your earnings change.";
}

export function assess(ie: IncomeAndExpenditure): AffordabilityOutcome {
  const totalIncomePence = sumAmounts(ie.earners);
  const totalExpenditurePence = sumAmounts(ie.expenditure);
  const disposableIncomePence = totalIncomePence - totalExpenditurePence;
  const irregularIncomeNote = buildIrregularIncomeNote(ie);

  if (ie.earners.length === 0 && ie.expenditure.length === 0) {
    return {
      state: "no-data",
      band: null,
      totalIncomePence: 0,
      totalExpenditurePence: 0,
      disposableIncomePence: 0,
      reasons: ["We don't have any income or outgoings to assess yet."],
    };
  }

  if (totalIncomePence === 0) {
    return {
      state: "zero-income",
      band: "shortfall",
      totalIncomePence,
      totalExpenditurePence,
      disposableIncomePence,
      reasons: [
        `You have no income recorded this month, but your outgoings total ${formatPounds(totalExpenditurePence)}.`,
      ],
      irregularIncomeNote,
    };
  }

  if (disposableIncomePence < 0) {
    const shortfallPence = Math.abs(disposableIncomePence);
    const largest = findLargestExpenditure(ie.expenditure);
    const largestLineReason = largest
      ? `Your largest outgoing is ${largest.label} at ${formatPounds(largest.amountPence)}.`
      : undefined;

    return {
      state: "shortfall",
      band: "shortfall",
      totalIncomePence,
      totalExpenditurePence,
      disposableIncomePence,
      reasons: [
        `Your outgoings exceed your income by ${formatPounds(shortfallPence)}.`,
        ...(largestLineReason ? [largestLineReason] : []),
      ],
      irregularIncomeNote,
    };
  }

  if (disposableIncomePence === 0) {
    return {
      state: "breakeven",
      band: "breakeven",
      totalIncomePence,
      totalExpenditurePence,
      disposableIncomePence,
      reasons: [
        "Your income exactly meets your outgoings this month, with nothing left over.",
      ],
      irregularIncomeNote,
    };
  }

  const nearBreakevenThreshold = Math.floor((totalIncomePence * 5) / 100);
  const nearBreakevenNote =
    disposableIncomePence > 0 && disposableIncomePence <= nearBreakevenThreshold
      ? "You have a little room after your outgoings, but only a small amount relative to your income."
      : undefined;

  return {
    state: "surplus",
    band: "surplus",
    totalIncomePence,
    totalExpenditurePence,
    disposableIncomePence,
    reasons: [
      `After your outgoings, you have ${formatPounds(disposableIncomePence)} left this month.`,
      ...(nearBreakevenNote ? [nearBreakevenNote] : []),
    ],
    irregularIncomeNote,
  };
}

export function outcomeStateToBand(state: OutcomeState): Band | null {
  switch (state) {
    case "no-data":
      return null;
    case "zero-income":
    case "shortfall":
      return "shortfall";
    case "breakeven":
      return "breakeven";
    case "surplus":
      return "surplus";
  }
}
