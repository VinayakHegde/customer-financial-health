import { describe, expect, it } from "vitest";
import { generateShareToken, hashShareToken } from "../../lib/share/token";

describe("T52 — S11: token generation — base64url + sha256-hex contract", () => {
  it("each call returns a 43-char base64url raw and 64-char lowercase-hex hash", () => {
    const { raw, hash } = generateShareToken();
    expect(raw).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("hashShareToken is idempotent: same raw always hashes to the same hash", () => {
    const { raw, hash } = generateShareToken();
    expect(hashShareToken(raw)).toBe(hash);
    expect(hashShareToken(raw)).toBe(hashShareToken(raw));
  });

  it("100 successive calls produce 100 distinct raws", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 100; i += 1) {
      seen.add(generateShareToken().raw);
    }
    expect(seen.size).toBe(100);
  });
});
