import { z } from "zod";
import type { IncomeAndExpenditure, ValidationError } from "./types";

const earnerSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Please enter a name for this income source.")
    .max(80, "Please keep the label to 80 characters or fewer."),
  amountPence: z
    .number({ error: "Please enter a valid amount." })
    .int("Please enter a whole number of pence.")
    .nonnegative("Amounts cannot be negative."),
  cadence: z.literal("monthly"),
  variable: z.boolean().optional(),
});

const expenditureSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Please enter a name for this outgoing.")
    .max(80, "Please keep the label to 80 characters or fewer."),
  amountPence: z
    .number({ error: "Please enter a valid amount." })
    .int("Please enter a whole number of pence.")
    .nonnegative("Amounts cannot be negative."),
});

export const incomeAndExpenditureSchema = z.object({
  earners: z.array(earnerSchema),
  expenditure: z.array(expenditureSchema),
});

function zodIssuesToValidationErrors(error: z.ZodError): ValidationError[] {
  return error.issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.join(".") : "_",
    message: issue.message,
  }));
}

export function validateIncomeAndExpenditure(
  input: unknown,
):
  | { ok: true; data: IncomeAndExpenditure }
  | { ok: false; errors: ValidationError[] } {
  const result = incomeAndExpenditureSchema.safeParse(input);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  return { ok: false, errors: zodIssuesToValidationErrors(result.error) };
}
