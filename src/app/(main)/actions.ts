"use server";

import { redirect } from "next/navigation";
import {
  clearPersonaId,
  setPersonaId,
} from "../../../lib/identity/persona-cookie";
import { getPersonaById } from "../../../lib/personas";

export async function selectPersona(formData: FormData): Promise<void> {
  const personaId = formData.get("personaId");
  if (typeof personaId !== "string" || !getPersonaById(personaId)) {
    redirect("/");
  }

  await setPersonaId(personaId);
  redirect("/dashboard");
}

/**
 * Symmetric counterpart to {@link selectPersona}: clears the persona cookie and
 * returns the user to the persona picker. Invoked by the "Switch persona"
 * `<form action={switchPersona}>` buttons in `<AppHeader />` and the
 * `<DashboardView />` hero greeting.
 */
export async function switchPersona(): Promise<void> {
  await clearPersonaId();
  redirect("/");
}
