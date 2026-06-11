"use server";

import { createShareLink, getSnapshotById } from "../../../../../lib/db";
import { getPersonaId } from "../../../../../lib/identity/persona-cookie";
import { getPersonaById } from "../../../../../lib/personas";
import { nowUtc } from "../../../../../lib/share/clock";
import { generateShareToken } from "../../../../../lib/share/token";

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

const PERSONA_ERROR = {
  ok: false as const,
  errors: [{ field: "_", message: "Please pick a persona first." }],
};

const GENERIC_SNAPSHOT_ERROR = {
  ok: false as const,
  errors: [
    {
      field: "_",
      message: "We couldn't share that snapshot. Please try again.",
    },
  ],
};

export type CreateShareLinkActionState =
  | { ok: true; url: string; expiresAt: string }
  | { ok: false; errors: { field: string; message: string }[] };

/**
 * Mint a 24-hour read-only share link for one of the caller's own snapshots.
 *
 * Step 1: persona-cookie validation through `getPersonaById(personaId)`.
 * Missing OR invalid (id present in cookie but not in the 7-persona fixture
 * set) → typed `_` error and **no DB write**. Three sub-cases (T58): cookie
 * absent, empty string, not-a-persona.
 *
 * Step 2: snapshot ownership check. If the row doesn't exist OR
 * `snapshot.customerId !== personaId`, return the **same** generic typed
 * error message — same shape, same string — so the caller cannot tell
 * cross-persona from non-existent. No DB write happens on either arm.
 *
 * Step 3: generate the 32-byte raw token + SHA-256 hash; insert one
 * `share_links` row with `expires_at = nowUtc() + 24h`. The raw token is
 * included in the returned URL once and is **never** persisted.
 *
 * Both error arms log nothing; the lifecycle line `share: link created` is
 * allowed to land on the happy path with no identifiers (T67).
 */
export async function createShareLinkAction(
  _prevState: CreateShareLinkActionState | null,
  formData: FormData,
): Promise<CreateShareLinkActionState> {
  const personaId = await getPersonaId();
  if (!personaId || !getPersonaById(personaId)) {
    return PERSONA_ERROR;
  }

  const snapshotIdRaw = formData.get("snapshotId");
  if (typeof snapshotIdRaw !== "string" || snapshotIdRaw.length === 0) {
    return GENERIC_SNAPSHOT_ERROR;
  }
  const snapshot = getSnapshotById(snapshotIdRaw);
  if (!snapshot || snapshot.customerId !== personaId) {
    return GENERIC_SNAPSHOT_ERROR;
  }

  const minted = nowUtc();
  const expires = new Date(minted.getTime() + TWENTY_FOUR_HOURS_MS);
  const { raw, hash } = generateShareToken();

  createShareLink({
    snapshotId: snapshot.id,
    tokenHash: hash,
    expiresAt: expires.toISOString(),
    createdAt: minted.toISOString(),
  });

  console.log("share: link created");

  return {
    ok: true,
    url: `/share/${raw}`,
    expiresAt: expires.toISOString(),
  };
}
