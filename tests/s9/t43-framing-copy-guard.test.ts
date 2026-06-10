import { describe, expect, it } from "vitest";
import { framingNotice } from "../../lib/affordability/framing";
import {
  framingAdviceForbiddenTokens,
  toneTokens,
} from "../_helpers/forbiddenToneTokens";

function findMatchingTokens(text: string, tokens: readonly string[]): string[] {
  const lower = text.toLowerCase();
  return tokens.filter((token) => lower.includes(token.toLowerCase()));
}

describe("T43 — Framing copy guard", () => {
  it("carries the required negation and stays free of forbidden tokens", () => {
    const copy = framingNotice();
    // TECH_SPEC S9: tone subset + R20 guard set (not full adviceImplyingTokens —
    // body must contain the required "not financial advice" negation phrase).
    const strings = [
      copy.headline,
      copy.body,
      copy.supportLink.label,
      copy.supportLink.href,
    ];

    expect(copy.body.toLowerCase()).toContain("not financial advice");

    for (const text of strings) {
      expect(findMatchingTokens(text, toneTokens)).toEqual([]);
      expect(findMatchingTokens(text, framingAdviceForbiddenTokens)).toEqual(
        [],
      );
    }
  });
});
