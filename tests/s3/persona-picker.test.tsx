import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { personas } from "../../lib/personas";
import { selectPersona } from "../../src/app/actions";
import Home from "../../src/app/page";
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
  it("lists all personas and offers a continue action", () => {
    render(<Home />);

    const select = screen.getByLabelText(/persona/i);
    expect(select).toBeDefined();

    for (const persona of personas) {
      expect(screen.getByRole("option", { name: persona.label })).toBeDefined();
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
