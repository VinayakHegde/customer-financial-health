const EARNER_LABEL = /^earners\.(\d+)\.label$/;
const EARNER_AMOUNT = /^earners\.(\d+)\.amount$/;
const EARNER_VARIABLE = /^earners\.(\d+)\.variable$/;
const EXPENDITURE_LABEL = /^expenditure\.(\d+)\.label$/;
const EXPENDITURE_AMOUNT = /^expenditure\.(\d+)\.amount$/;

const POUNDS_PATTERN = /^\d+(\.\d{1,2})?$/;

export type ParsePoundsResult = number | "blank" | "invalid";

export function parsePoundsToPence(raw: string): ParsePoundsResult {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return "blank";
  }

  if (!POUNDS_PATTERN.test(trimmed)) {
    return "invalid";
  }

  const dotIndex = trimmed.indexOf(".");
  const poundsPart = dotIndex === -1 ? trimmed : trimmed.slice(0, dotIndex);
  const fractionPart = dotIndex === -1 ? "" : trimmed.slice(dotIndex + 1);
  const fracPadded = `${fractionPart}00`.slice(0, 2);

  return Number(poundsPart) * 100 + Number(fracPadded);
}

function amountFieldValue(
  amountRaw: string,
  amountPence: ParsePoundsResult,
): string | number {
  if (amountPence === "blank" || amountPence === "invalid") {
    return amountRaw.trim().length === 0 ? "" : amountRaw;
  }

  return amountPence;
}

function maxIndex(indices: number[]): number {
  return indices.length === 0 ? -1 : Math.max(...indices);
}

export function parseIncomeAndExpenditureFromFormData(
  formData: FormData,
): unknown {
  const earnerLabels = new Map<number, string>();
  const earnerAmounts = new Map<number, string>();
  const earnerVariable = new Set<number>();
  const expenditureLabels = new Map<number, string>();
  const expenditureAmounts = new Map<number, string>();

  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string") {
      continue;
    }

    const earnerLabelMatch = key.match(EARNER_LABEL);
    if (earnerLabelMatch) {
      earnerLabels.set(Number(earnerLabelMatch[1]), value);
      continue;
    }

    const earnerAmountMatch = key.match(EARNER_AMOUNT);
    if (earnerAmountMatch) {
      earnerAmounts.set(Number(earnerAmountMatch[1]), value);
      continue;
    }

    const earnerVariableMatch = key.match(EARNER_VARIABLE);
    if (earnerVariableMatch) {
      earnerVariable.add(Number(earnerVariableMatch[1]));
      continue;
    }

    const expenditureLabelMatch = key.match(EXPENDITURE_LABEL);
    if (expenditureLabelMatch) {
      expenditureLabels.set(Number(expenditureLabelMatch[1]), value);
      continue;
    }

    const expenditureAmountMatch = key.match(EXPENDITURE_AMOUNT);
    if (expenditureAmountMatch) {
      expenditureAmounts.set(Number(expenditureAmountMatch[1]), value);
    }
  }

  const maxEarnerIndex = maxIndex([
    ...earnerLabels.keys(),
    ...earnerAmounts.keys(),
    ...earnerVariable,
  ]);
  const earners = [];
  for (let index = 0; index <= maxEarnerIndex; index += 1) {
    const label = earnerLabels.get(index) ?? "";
    const amountRaw = earnerAmounts.get(index) ?? "";
    const amountPence = parsePoundsToPence(amountRaw);

    earners.push({
      label,
      amountPence: amountFieldValue(amountRaw, amountPence),
      cadence: "monthly",
      ...(earnerVariable.has(index) ? { variable: true } : {}),
    });
  }

  const maxExpenditureIndex = maxIndex([
    ...expenditureLabels.keys(),
    ...expenditureAmounts.keys(),
  ]);
  const expenditure = [];
  for (let index = 0; index <= maxExpenditureIndex; index += 1) {
    const label = expenditureLabels.get(index) ?? "";
    const amountRaw = expenditureAmounts.get(index) ?? "";
    const amountPence = parsePoundsToPence(amountRaw);

    expenditure.push({
      label,
      amountPence: amountFieldValue(amountRaw, amountPence),
    });
  }

  return { earners, expenditure };
}
