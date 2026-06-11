import { formData } from "../_helpers/formData";

/** FormData encoding of a valid I&E for persona `jordan` (T18, T20). */
export function formDataValidJordan(): FormData {
  return formData({
    "earners.0.label": "Jordan",
    "earners.0.amount": "1650.00",
    "expenditure.0.label": "Rent",
    "expenditure.0.amount": "1050.00",
    "expenditure.1.label": "Utilities",
    "expenditure.1.amount": "180.00",
    "expenditure.2.label": "Food",
    "expenditure.2.amount": "360.00",
    "expenditure.3.label": "Travel",
    "expenditure.3.amount": "120.00",
    "expenditure.4.label": "Loan",
    "expenditure.4.amount": "220.00",
  });
}

/** FormData with a negative amount (T19). */
export function formDataInvalidNegative(): FormData {
  return formData({
    "earners.0.label": "Jordan",
    "earners.0.amount": "-10.00",
    "expenditure.0.label": "Rent",
    "expenditure.0.amount": "100.00",
  });
}

/** FormData with a non-numeric amount (T19). */
export function formDataInvalidNonNumeric(): FormData {
  return formData({
    "earners.0.label": "Jordan",
    "earners.0.amount": "not-a-number",
    "expenditure.0.label": "Rent",
    "expenditure.0.amount": "100.00",
  });
}

/** FormData with a blank amount (T19). */
export function formDataBlankAmount(): FormData {
  return formData({
    "earners.0.label": "Jordan",
    "earners.0.amount": "",
    "expenditure.0.label": "Rent",
    "expenditure.0.amount": "100.00",
  });
}
