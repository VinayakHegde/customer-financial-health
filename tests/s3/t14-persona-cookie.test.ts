import { afterEach, describe, expect, it } from "vitest";
import {
  getPersonaId,
  PERSONA_COOKIE_NAME,
  setPersonaId,
} from "../../lib/identity/persona-cookie";
import {
  getActivePersonaIdForTests,
  withPersonaCookie,
} from "../_helpers/withPersonaCookie";

describe("T14 — Persona cookie helper (mocked headers)", () => {
  let teardown: (() => void) | undefined;

  afterEach(() => {
    teardown?.();
    teardown = undefined;
  });

  it("uses the same cookie name as the mock helper", () => {
    expect(PERSONA_COOKIE_NAME).toBe("personaId");
  });

  it("returns the installed persona id", async () => {
    teardown = withPersonaCookie("pat");
    await expect(getPersonaId()).resolves.toBe("pat");
  });

  it("returns null when no persona cookie is installed", async () => {
    teardown = withPersonaCookie(null);
    await expect(getPersonaId()).resolves.toBeNull();
  });

  it("setPersonaId writes a cookie read by getPersonaId", async () => {
    await setPersonaId("pat");
    expect(getActivePersonaIdForTests()).toBe("pat");
    await expect(getPersonaId()).resolves.toBe("pat");
    teardown = withPersonaCookie(null);
  });
});
