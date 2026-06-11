import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { personas } from "../../lib/personas";
import { selectPersona } from "../../src/app/(main)/actions";
import Home from "../../src/app/(main)/page";
import {
  getActivePersonaIdForTests,
  withPersonaCookie,
} from "../_helpers/withPersonaCookie";

const redirectMock = vi.hoisted(() =>
  vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
);

vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirectMock(path),
}));

describe("Persona picker on /", () => {
  it("lists all personas as a radio group and offers a continue action", () => {
    render(<Home />);

    const personaGroup = screen.getByRole("group", { name: /persona/i });
    expect(personaGroup).toBeDefined();

    const radios = screen.getAllByRole("radio");
    expect(radios.length).toBe(personas.length);

    for (const persona of personas) {
      const radio = screen.getByDisplayValue(persona.id) as HTMLInputElement;
      expect(radio.tagName).toBe("INPUT");
      expect(radio.getAttribute("type")).toBe("radio");
      expect(radio.getAttribute("name")).toBe("personaId");

      const [namePart] = persona.label.split("—");
      const name = (namePart ?? persona.label).trim();
      expect(screen.getByText(name)).toBeDefined();
    }

    expect(
      screen.getByRole("button", { name: /continue to dashboard/i }),
    ).toBeDefined();
  });
});

describe("selectPersona server action", () => {
  let teardown: (() => void) | undefined;

  beforeEach(() => {
    teardown = withPersonaCookie(null);
    redirectMock.mockClear();
  });

  afterEach(() => {
    teardown?.();
    teardown = undefined;
  });

  it("sets the persona cookie and redirects to /dashboard for a valid persona", async () => {
    const formData = new FormData();
    formData.set("personaId", "pat");

    await expect(selectPersona(formData)).rejects.toThrow(
      "REDIRECT:/dashboard",
    );
    expect(getActivePersonaIdForTests()).toBe("pat");
  });

  it("redirects to / when the persona id is invalid", async () => {
    const formData = new FormData();
    formData.set("personaId", "bogus");

    await expect(selectPersona(formData)).rejects.toThrow("REDIRECT:/");
  });
});
