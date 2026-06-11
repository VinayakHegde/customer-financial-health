import type { ValidationError } from "../affordability/types";

export type UpdateSnapshotState =
  | { ok: true }
  | { ok: false; errors: ValidationError[] };
