import { vi } from "vitest";

let activePersonaId: string | null = null;

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "personaId" && activePersonaId !== null
        ? { value: activePersonaId }
        : undefined,
  }),
}));

/**
 * Installs a test-scoped persona cookie mock. Call the returned teardown
 * in `afterEach` (or invoke it directly) to restore the default null state.
 */
export function withPersonaCookie(personaId: string | null): () => void {
  activePersonaId = personaId;
  return () => {
    activePersonaId = null;
  };
}

/** Reads the persona id currently installed by {@link withPersonaCookie}. */
export function getActivePersonaIdForTests(): string | null {
  return activePersonaId;
}
