import { redirect } from "next/navigation";
import { HistoryList } from "../../../../components/HistoryList";
import { listSnapshots } from "../../../../lib/db";
import { getPersonaId } from "../../../../lib/identity/persona-cookie";
import { getPersonaById } from "../../../../lib/personas";

export default async function HistoryPage() {
  const personaId = await getPersonaId();
  if (!personaId) {
    redirect("/");
  }

  const persona = getPersonaById(personaId);
  if (!persona) {
    redirect("/");
  }

  const snapshots = listSnapshots(personaId);

  return <HistoryList snapshots={snapshots} />;
}
