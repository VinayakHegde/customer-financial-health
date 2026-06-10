import type { OutcomeCopy, OutcomeState, SupportSignpostCopy } from "./types";

const supportHref = "/support";

const supportSignpostDefault: SupportSignpostCopy = {
  href: supportHref,
  label: "Talk to our support team",
  message: "If you have questions about your assessment, our team can help.",
};

const supportSignpostStrong: SupportSignpostCopy = {
  href: supportHref,
  label: "Speak with our support team",
  message:
    "If you're finding things difficult, our team can help you talk through options.",
};

export function copyForSurplus(): OutcomeCopy {
  return {
    headline: "You have some room after your outgoings",
    body: "Your income covers your monthly outgoings with a little left over. This is a snapshot of what you told us, not a forecast.",
    supportSignpost: supportSignpostDefault,
  };
}

export function copyForBreakeven(): OutcomeCopy {
  return {
    headline: "Your income and outgoings balance this month",
    body: "What comes in matches what goes out. Small changes either way could shift this picture.",
    supportSignpost: supportSignpostDefault,
  };
}

export function copyForShortfall(): OutcomeCopy {
  return {
    headline: "Your outgoings are higher than your income",
    body: "There is a gap between what you earn and what you spend this month. Our team can help you talk through options.",
    supportSignpost: supportSignpostStrong,
  };
}

export function copyForZeroIncome(): OutcomeCopy {
  return {
    headline: "You have outgoings but no income recorded this month",
    body: "Without income showing this month, your outgoings leave a gap. If your situation has changed, updating your figures can help.",
    supportSignpost: {
      href: supportHref,
      label: "Speak with our support team",
      message:
        "If you have no income showing this month and need help, our team can listen.",
    },
  };
}

export function copyForNoData(): OutcomeCopy {
  return {
    headline: "We have not assessed your position yet",
    body: "Add your income and outgoings to see how things look this month.",
    supportSignpost: supportSignpostDefault,
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
