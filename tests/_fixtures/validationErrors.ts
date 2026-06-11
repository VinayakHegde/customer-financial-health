import type { ValidationError } from "../../lib/affordability/types";

export const validationErrorsFixture: ValidationError[] = [
  {
    field: "earners.0.amountPence",
    message: "Please enter a valid amount.",
  },
  {
    field: "expenditure.1.label",
    message: "Please enter a name for this outgoing.",
  },
  {
    field: "expenditure.1.amountPence",
    message: "Please enter a valid amount.",
  },
];

export const validationErrorState = {
  ok: false as const,
  errors: validationErrorsFixture,
};
