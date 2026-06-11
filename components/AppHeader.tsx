import { Wallet } from "lucide-react";
import { getLatestSnapshot } from "../lib/db";
import { getPersonaId } from "../lib/identity/persona-cookie";
import { getPersonaById, personaFirstName } from "../lib/personas";
import { AppHeaderClientRegion } from "./AppHeaderClientRegion";

export async function AppHeader() {
  const personaId = await getPersonaId();
  const persona = personaId ? getPersonaById(personaId) : undefined;
  // A persona that has not yet submitted any I&E is a "new customer". For that
  // state we hide the Update + History links from the primary nav, because both
  // routes lead to surfaces that have no content yet — the only path to a first
  // submission is the renamed CTA inside the dashboard hero. One cheap
  // single-row lookup; both /dashboard and the AppHeader run on every request.
  const hasSnapshots = persona ? getLatestSnapshot(persona.id) !== null : false;

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3 sm:py-4">
        <a
          href={persona ? "/dashboard" : "/"}
          className="inline-flex items-center gap-2 rounded-md px-1 py-1 text-sm font-semibold text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <span
            aria-hidden="true"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground"
          >
            <Wallet aria-hidden="true" className="h-4 w-4" />
          </span>
          <span className="hidden sm:inline">Customer Financial Health</span>
          <span className="sm:hidden">CFH</span>
        </a>

        <AppHeaderClientRegion
          hasPersona={!!persona}
          hasSnapshots={hasSnapshots}
          firstName={persona ? personaFirstName(persona.label) : null}
        />
      </div>
    </header>
  );
}
