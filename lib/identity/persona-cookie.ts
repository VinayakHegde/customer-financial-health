import { cookies } from "next/headers";

export const PERSONA_COOKIE_NAME = "personaId";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export async function getPersonaId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(PERSONA_COOKIE_NAME)?.value ?? null;
}

export async function setPersonaId(id: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(PERSONA_COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

/**
 * Clears the persona cookie. Used by the "Switch persona" Server Action so
 * that landing back on `/` is a real "no persona selected" state, not just a
 * navigation away from the dashboard with the previous cookie still present.
 * Symmetric to {@link setPersonaId}.
 */
export async function clearPersonaId(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(PERSONA_COOKIE_NAME);
}
