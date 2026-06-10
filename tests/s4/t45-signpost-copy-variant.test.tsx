import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SupportSignpost } from "../../components/SupportSignpost";
import { assess } from "../../lib/affordability/calculator";
import {
  ieAlexZeroIncome,
  ieJordanShortfall,
  iePatSurplus,
} from "../_fixtures/ie";

function signpostCopyText(state: ReturnType<typeof assess>["state"]): string {
  const { container } = render(<SupportSignpost state={state} />);
  return container.textContent?.trim() ?? "";
}

describe("T45 — SupportSignpost: outcome-scaled copy variant", () => {
  afterEach(() => {
    cleanup();
  });

  it("uses stronger copy for zero-income and shortfall than surplus", () => {
    const surplusCopy = signpostCopyText(assess(iePatSurplus).state);
    const zeroIncomeCopy = signpostCopyText(assess(ieAlexZeroIncome).state);
    const shortfallCopy = signpostCopyText(assess(ieJordanShortfall).state);

    expect(zeroIncomeCopy).not.toBe(surplusCopy);
    expect(shortfallCopy).not.toBe(surplusCopy);
  });
});
