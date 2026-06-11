import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { UpdateForm } from "../../components/UpdateForm";
import { validationErrorState } from "../_fixtures/validationErrors";

async function noopAction() {
  return { ok: true as const };
}

describe("T24 — UpdateForm: error summary and field errors", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows an alert summary with focus and marks invalid fields", async () => {
    const { container } = render(
      <UpdateForm
        action={noopAction}
        serverState={validationErrorState}
        prefill={{
          earners: [
            { label: "Jordan", amountPence: 165_000, cadence: "monthly" },
          ],
          expenditure: [
            { label: "Rent", amountPence: 105_000 },
            { label: "", amountPence: 0 },
          ],
        }}
      />,
    );

    const summary = screen.getByRole("alert");
    expect(summary).toBeDefined();
    expect(document.activeElement).toBe(summary);

    const amountInput = container.querySelector(
      "#field-earners-0-amount",
    ) as HTMLInputElement;
    expect(amountInput.getAttribute("aria-invalid")).toBe("true");
    expect(amountInput.getAttribute("aria-describedby")).toContain(
      "field-earners-0-amount-error",
    );

    const expenditureLabel = container.querySelector(
      "#field-expenditure-1-label",
    ) as HTMLInputElement;
    expect(expenditureLabel.getAttribute("aria-invalid")).toBe("true");

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
