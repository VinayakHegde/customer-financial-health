import { describe, expect, it } from "vitest";
import { shareUnavailableCopySample } from "../../lib/share/copy";
import {
  adviceImplyingTokens,
  toneTokens,
} from "../_helpers/forbiddenToneTokens";

describe("T76 — S11: <ShareUnavailable /> copy passes tone + advice-implying token scans", () => {
  it.each(toneTokens)("does not contain tone token %s", (token) => {
    expect(shareUnavailableCopySample.toLowerCase()).not.toContain(token);
  });

  it.each(adviceImplyingTokens)(
    "does not contain advice-implying token %s",
    (token) => {
      expect(shareUnavailableCopySample.toLowerCase()).not.toContain(token);
    },
  );
});
