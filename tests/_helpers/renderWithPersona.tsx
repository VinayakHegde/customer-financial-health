import {
  type RenderOptions,
  type RenderResult,
  render,
} from "@testing-library/react";
import type { ReactElement } from "react";

export function renderWithPersona(
  ui: ReactElement,
  _personaId: string,
  options?: Omit<RenderOptions, "wrapper">,
): RenderResult {
  return render(ui, options);
}
