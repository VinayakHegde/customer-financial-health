import type { Band, Delta, Snapshot } from "../affordability/types";

function bandRank(band: Band | null): number {
  switch (band) {
    case "surplus":
      return 3;
    case "breakeven":
      return 2;
    case "shortfall":
      return 1;
    default:
      return 0;
  }
}

export function computeDelta(snapshots: Snapshot[]): Delta {
  if (snapshots.length < 2) {
    return { kind: "first-snapshot" };
  }

  const [current, previous] = snapshots;
  const disposableDeltaPence =
    current.outcome.disposableIncomePence -
    previous.outcome.disposableIncomePence;

  const currentRank = bandRank(current.outcome.band);
  const previousRank = bandRank(previous.outcome.band);

  let bandChange: "improved" | "worsened" | "unchanged";
  if (currentRank > previousRank) {
    bandChange = "improved";
  } else if (currentRank < previousRank) {
    bandChange = "worsened";
  } else {
    bandChange = "unchanged";
  }

  return {
    kind: "change",
    disposableDeltaPence,
    bandChange,
    previousTakenAt: previous.takenAt,
  };
}
