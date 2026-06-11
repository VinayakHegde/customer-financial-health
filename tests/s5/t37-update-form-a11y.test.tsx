import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { UpdateForm } from "../../components/UpdateForm";
import { ieJordanShortfall } from "../_fixtures/ie";
import { validationErrorState } from "../_fixtures/validationErrors";

async function noopAction() {
  return { ok: true as const };
}

describe("T37 — UpdateForm: accessibility smoke", () => {
  afterEach(() => {
    cleanup();
  });

  it("passes axe in the pristine state with labels and fieldsets", async () => {
    const { container } = render(
      <UpdateForm action={noopAction} prefill={ieJordanShortfall} />,
    );

    const inputs = container.querySelectorAll("input[type='text']");
    for (const input of inputs) {
      const id = input.getAttribute("id");
      expect(id).toBeTruthy();
      expect(container.querySelector(`label[for="${id}"]`)).toBeTruthy();
    }

    expect(container.querySelectorAll("fieldset").length).toBe(2);
    expect(container.querySelectorAll("legend").length).toBe(2);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("passes axe in the error state", async () => {
    const { container } = render(
      <UpdateForm
        action={noopAction}
        prefill={ieJordanShortfall}
        serverState={validationErrorState}
      />,
    );

    const expenditureAmount = container.querySelector(
      "#field-expenditure-1-amount",
    ) as HTMLInputElement | null;
    const amountHintId = container
      .querySelector("#field-earners-0-amount")
      ?.getAttribute("aria-describedby")
      ?.split(" ")[0];
    expect(expenditureAmount).toBeTruthy();
    expect(amountHintId).toBeTruthy();
    expect(expenditureAmount?.getAttribute("aria-describedby")).toContain(
      amountHintId as string,
    );
    expect(expenditureAmount?.getAttribute("aria-describedby")).toContain(
      "field-expenditure-1-amount-error",
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
