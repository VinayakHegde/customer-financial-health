import type { Delta } from "../../lib/affordability/types";

export const deltaFirstSnapshot: Delta = { kind: "first-snapshot" };

export const deltaChangeImproved: Delta = {
  kind: "change",
  disposableDeltaPence: 50_000,
  bandChange: "improved",
  previousTakenAt: "2026-05-01T10:00:00.000Z",
};

export const deltaChangeWorsened: Delta = {
  kind: "change",
  disposableDeltaPence: -30_000,
  bandChange: "worsened",
  previousTakenAt: "2026-05-15T14:30:00.000Z",
};

export const deltaChangeUnchanged: Delta = {
  kind: "change",
  disposableDeltaPence: 0,
  bandChange: "unchanged",
  previousTakenAt: "2026-04-20T09:00:00.000Z",
};
