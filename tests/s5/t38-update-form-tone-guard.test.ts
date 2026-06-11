import { describe, expect, it } from "vitest";
import { updateFormCopyStrings } from "../../lib/update/copy";
import {
  adviceImplyingTokens,
  toneTokens,
} from "../_helpers/forbiddenToneTokens";

function findMatchingTokens(text: string, tokens: readonly string[]): string[] {
  const lower = text.toLowerCase();
  return tokens.filter((token) => lower.includes(token.toLowerCase()));
}

describe("T38 — UpdateForm: tone guard on form copy", () => {
  it("keeps forbidden tokens out of exported form copy strings", () => {
    for (const text of updateFormCopyStrings) {
      expect(findMatchingTokens(text, toneTokens)).toEqual([]);
      expect(findMatchingTokens(text, adviceImplyingTokens)).toEqual([]);
    }
  });
});
