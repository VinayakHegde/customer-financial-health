import { describe, expect, it } from "vitest";
import { parsePoundsToPence } from "../../lib/update/parseFormData";

describe("parsePoundsToPence", () => {
  it.each([
    ["1234", 123_400],
    ["1234.5", 123_450],
    ["1234.56", 123_456],
    ["0", 0],
    ["0.00", 0],
  ] as const)("parses %s to %i pence", (input, expected) => {
    expect(parsePoundsToPence(input)).toBe(expected);
  });

  it.each([
    ["", "blank"],
    ["   ", "blank"],
    ["not-a-number", "invalid"],
    ["12.345", "invalid"],
    ["-1", "invalid"],
  ] as const)("rejects %j as %s", (input, expected) => {
    expect(parsePoundsToPence(input)).toBe(expected);
  });
});
