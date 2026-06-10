import { describe, expect, it } from "vitest";
import { incomeAndExpenditureSchema } from "../../lib/affordability/validation";
import { getPersonasForSeeding, personas } from "../../lib/personas";

describe("T13 — Persona fixtures shape", () => {
  it("exports exactly seven personas", () => {
    expect(personas).toHaveLength(7);
  });

  it.each(personas.map((persona) => [persona.id, persona.startingIe] as const))(
    "starting I&E for %s parses against zod schema",
    (_id, startingIe) => {
      const result = incomeAndExpenditureSchema.safeParse(startingIe);
      expect(result.success).toBe(true);
    },
  );

  it("excludes riley from seed data", () => {
    const seedIds = getPersonasForSeeding().map((persona) => persona.id);
    expect(seedIds).toHaveLength(6);
    expect(seedIds).not.toContain("riley");
  });
});
