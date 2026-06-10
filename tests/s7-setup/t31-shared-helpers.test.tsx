import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  adviceImplyingTokens,
  forbiddenToneTokens,
  formData,
  getActivePersonaIdForTests,
  makeDb,
  renderWithPersona,
  toneTokens,
  withPersonaCookie,
} from "../_helpers";

describe("T31 — Shared helpers export", () => {
  afterEach(() => {
    withPersonaCookie(null)();
  });

  it("exports forbiddenToneTokens with finalised tone and advice lists", () => {
    expect(toneTokens.length).toBeGreaterThan(0);
    expect(adviceImplyingTokens.length).toBeGreaterThan(0);
    expect(forbiddenToneTokens).toEqual([
      ...toneTokens,
      ...adviceImplyingTokens,
    ]);
    expect(forbiddenToneTokens).toContain("must");
    expect(forbiddenToneTokens).toContain("recommend");
  });

  it("builds FormData from a plain record", () => {
    const fd = formData({ income: "320000", label: "Pat" });
    expect(fd.get("income")).toBe("320000");
    expect(fd.get("label")).toBe("Pat");
  });

  it("opens an in-memory database via makeDb()", () => {
    const { db, close } = makeDb();
    expect(db).toBeDefined();
    close();
  });

  it("renders a sync component via renderWithPersona()", () => {
    renderWithPersona(<p>Hello, Pat</p>, "pat");
    expect(screen.getByText("Hello, Pat")).toBeDefined();
  });

  it("installs a persona cookie mock via withPersonaCookie()", () => {
    const teardown = withPersonaCookie("jordan");
    expect(getActivePersonaIdForTests()).toBe("jordan");
    teardown();
    expect(getActivePersonaIdForTests()).toBeNull();
  });
});
