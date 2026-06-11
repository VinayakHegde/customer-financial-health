import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { UpdateForm } from "../../components/UpdateForm";
import { ieMorganDrewJoint } from "../_fixtures/ie";
import { validationErrorState } from "../_fixtures/validationErrors";

async function noopAction() {
  return { ok: true as const };
}

describe("T25 — UpdateForm: preserve input on error (SC 3.3.7)", () => {
  afterEach(() => {
    cleanup();
  });

  it("keeps previously entered values when the error state is re-rendered", () => {
    const props = {
      action: noopAction,
      prefill: ieMorganDrewJoint,
      initialEarnerCount: 2,
    };

    const { rerender } = render(<UpdateForm {...props} />);

    expect(screen.getByDisplayValue("Morgan")).toBeDefined();
    expect(screen.getByDisplayValue("Drew")).toBeDefined();
    expect(screen.getByDisplayValue("1800.00")).toBeDefined();
    expect(screen.getByDisplayValue("1400.00")).toBeDefined();
    expect(screen.getByDisplayValue("Rent")).toBeDefined();
    expect(screen.getByDisplayValue("1450.00")).toBeDefined();

    rerender(<UpdateForm {...props} serverState={validationErrorState} />);

    expect(screen.getByDisplayValue("Morgan")).toBeDefined();
    expect(screen.getByDisplayValue("Drew")).toBeDefined();
    expect(screen.getByDisplayValue("1800.00")).toBeDefined();
    expect(screen.getByDisplayValue("1400.00")).toBeDefined();
    expect(screen.getByDisplayValue("Rent")).toBeDefined();
    expect(screen.getByDisplayValue("1450.00")).toBeDefined();
  });

  it("keeps values typed after first render when the error state is re-rendered", () => {
    const props = { action: noopAction };

    const { container, rerender } = render(<UpdateForm {...props} />);

    const earnerLabel = container.querySelector(
      "#field-earners-0-label",
    ) as HTMLInputElement;
    const earnerAmount = container.querySelector(
      "#field-earners-0-amount",
    ) as HTMLInputElement;
    const expenditureLabel = container.querySelector(
      "#field-expenditure-0-label",
    ) as HTMLInputElement;

    fireEvent.change(earnerLabel, { target: { value: "Casey" } });
    fireEvent.change(earnerAmount, { target: { value: "2750.50" } });
    fireEvent.change(expenditureLabel, { target: { value: "Rent" } });

    expect(earnerLabel.value).toBe("Casey");
    expect(earnerAmount.value).toBe("2750.50");
    expect(expenditureLabel.value).toBe("Rent");

    rerender(<UpdateForm {...props} serverState={validationErrorState} />);

    const earnerLabelAfter = container.querySelector(
      "#field-earners-0-label",
    ) as HTMLInputElement;
    const earnerAmountAfter = container.querySelector(
      "#field-earners-0-amount",
    ) as HTMLInputElement;
    const expenditureLabelAfter = container.querySelector(
      "#field-expenditure-0-label",
    ) as HTMLInputElement;

    expect(earnerLabelAfter.value).toBe("Casey");
    expect(earnerAmountAfter.value).toBe("2750.50");
    expect(expenditureLabelAfter.value).toBe("Rent");
  });
});
