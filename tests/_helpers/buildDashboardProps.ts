import type { DashboardViewProps } from "../../components/DashboardView";
import { getCopyForOutcome } from "../../lib/affordability/copy";
import type {
  AffordabilityOutcome,
  Delta,
  OutcomeCopy,
} from "../../lib/affordability/types";
import { getPersonaById } from "../../lib/personas";

export function buildDashboardProps(input: {
  personaId: string;
  outcome: AffordabilityOutcome;
  delta: Delta;
  copy?: OutcomeCopy;
}): DashboardViewProps {
  const persona = getPersonaById(input.personaId);

  return {
    personaLabel: persona?.label ?? input.personaId,
    outcome: input.outcome,
    copy: input.copy ?? getCopyForOutcome(input.outcome.state),
    delta: input.delta,
  };
}
