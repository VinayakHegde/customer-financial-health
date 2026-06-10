import { describe, expect, it } from "vitest";
import {
  allOutcomeStates,
  getCopyForOutcome,
} from "../../lib/affordability/copy";
import {
  adviceImplyingTokens,
  toneTokens,
} from "../_helpers/forbiddenToneTokens";

function findMatchingTokens(text: string, tokens: readonly string[]): string[] {
  const lower = text.toLowerCase();
  return tokens.filter((token) => lower.includes(token.toLowerCase()));
}

describe("T29 — Tone guard: copy.ts", () => {
  it.each(allOutcomeStates.map((state) => [state] as const))(
    "keeps forbidden tokens out of copy for %s",
    (state) => {
      const copy = getCopyForOutcome(state);
      const strings = [
        copy.headline,
        copy.body,
        copy.supportSignpost.label,
        copy.supportSignpost.href,
      ];

      for (const text of strings) {
        expect(findMatchingTokens(text, toneTokens)).toEqual([]);
        expect(findMatchingTokens(text, adviceImplyingTokens)).toEqual([]);
      }
    },
  );
});
