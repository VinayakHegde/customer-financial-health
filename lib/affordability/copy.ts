import type { OutcomeCopy, OutcomeState } from "./types";

const supportSignpost = {
  href: "/support",
  label: "Talk to our support team",
} as const;

export function copyForSurplus(): OutcomeCopy {
  return {
    headline: "You have some room after your outgoings",
    body: "Your income covers your monthly outgoings with a little left over. This is a snapshot of what you told us, not a forecast.",
    supportSignpost,
  };
}

export function copyForBreakeven(): OutcomeCopy {
  return {
    headline: "Your income and outgoings balance this month",
    body: "What comes in matches what goes out. Small changes either way could shift this picture.",
    supportSignpost,
  };
}

export function copyForShortfall(): OutcomeCopy {
  return {
    headline: "Your outgoings are higher than your income",
    body: "There is a gap between what you earn and what you spend this month. Our team can help you talk through options.",
    supportSignpost,
  };
}

export function copyForZeroIncome(): OutcomeCopy {
  return {
    headline: "You have outgoings but no income recorded this month",
    body: "Without income showing this month, your outgoings leave a gap. If your situation has changed, updating your figures can help.",
    supportSignpost,
  };
}

export function copyForNoData(): OutcomeCopy {
  return {
    headline: "We have not assessed your position yet",
    body: "Add your income and outgoings to see how things look this month.",
    supportSignpost,
  };
}

export function getCopyForOutcome(state: OutcomeState): OutcomeCopy {
  switch (state) {
    case "surplus":
      return copyForSurplus();
    case "breakeven":
      return copyForBreakeven();
    case "shortfall":
      return copyForShortfall();
    case "zero-income":
      return copyForZeroIncome();
    case "no-data":
      return copyForNoData();
  }
}

export const allOutcomeStates: OutcomeState[] = [
  "surplus",
  "breakeven",
  "shortfall",
  "zero-income",
  "no-data",
];
