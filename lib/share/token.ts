import { createHash, randomBytes } from "node:crypto";

/**
 * 32 random bytes → base64url string (43 chars when unpadded). The DB never
 * sees the raw value; only the SHA-256 hex hash is persisted.
 */
export function generateShareToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("base64url");
  return { raw, hash: hashShareToken(raw) };
}

/** Lower-case SHA-256 hex; 64 chars. Used by the resolver to look up rows. */
export function hashShareToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
