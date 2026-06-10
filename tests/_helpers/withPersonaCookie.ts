import { vi } from "vitest";
import { PERSONA_COOKIE_NAME } from "../../lib/identity/persona-cookie";

const personaCookieState = vi.hoisted(() => ({
  activeId: null as string | null,
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === PERSONA_COOKIE_NAME && personaCookieState.activeId !== null
        ? { value: personaCookieState.activeId }
        : undefined,
    set: (name: string, value: string) => {
      if (name === PERSONA_COOKIE_NAME) {
        personaCookieState.activeId = value;
      }
    },
  }),
}));

/**
 * Installs a test-scoped persona cookie mock. Call the returned teardown
 * in `afterEach` (or invoke it directly) to restore the default null state.
 */
export function withPersonaCookie(personaId: string | null): () => void {
  personaCookieState.activeId = personaId;
  return () => {
    personaCookieState.activeId = null;
  };
}

/** Reads the persona id currently installed by {@link withPersonaCookie}. */
export function getActivePersonaIdForTests(): string | null {
  return personaCookieState.activeId;
}
