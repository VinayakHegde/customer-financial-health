import { redirect } from "next/navigation";
import { DashboardView } from "../../../../components/DashboardView";
import { assess } from "../../../../lib/affordability/calculator";
import { getCopyForOutcome } from "../../../../lib/affordability/copy";
import { computeDelta } from "../../../../lib/dashboard/computeDelta";
import { listSnapshots } from "../../../../lib/db";
import { getPersonaId } from "../../../../lib/identity/persona-cookie";
import { getPersonaById } from "../../../../lib/personas";

export default async function DashboardPage() {
  const personaId = await getPersonaId();
  if (!personaId) {
    redirect("/");
  }

  const persona = getPersonaById(personaId);
  if (!persona) {
    redirect("/");
  }

  const snapshots = listSnapshots(personaId);
  const latest = snapshots[0];
  const outcome = latest?.outcome ?? assess({ earners: [], expenditure: [] });
  const delta = computeDelta(snapshots);

  return (
    <DashboardView
      personaLabel={persona.label}
      outcome={outcome}
      copy={getCopyForOutcome(outcome.state)}
      delta={delta}
      latestSnapshotId={latest?.id ?? null}
    />
  );
}
