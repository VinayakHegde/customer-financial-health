"use server";

import { redirect } from "next/navigation";
import { setPersonaId } from "../../lib/identity/persona-cookie";
import { getPersonaById } from "../../lib/personas";

export async function selectPersona(formData: FormData): Promise<void> {
  const personaId = formData.get("personaId");
  if (typeof personaId !== "string" || !getPersonaById(personaId)) {
    redirect("/");
  }

  await setPersonaId(personaId);
  redirect("/dashboard");
}
