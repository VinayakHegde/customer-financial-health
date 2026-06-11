import { redirect } from "next/navigation";
import { UpdateForm } from "../../../../components/UpdateForm";
import { getLatestSnapshot } from "../../../../lib/db";
import { getPersonaId } from "../../../../lib/identity/persona-cookie";
import { getPersonaById } from "../../../../lib/personas";
import { updateSnapshotAction } from "./actions";

export default async function UpdatePage() {
  const personaId = await getPersonaId();
  if (!personaId) {
    redirect("/");
  }

  const persona = getPersonaById(personaId);
  if (!persona) {
    redirect("/");
  }

  const latest = getLatestSnapshot(personaId);
  const initialEarnerCount = Math.max(persona.startingIe.earners.length, 1);

  return (
    <UpdateForm
      prefill={latest?.ie}
      initialEarnerCount={initialEarnerCount}
      action={updateSnapshotAction}
    />
  );
}
