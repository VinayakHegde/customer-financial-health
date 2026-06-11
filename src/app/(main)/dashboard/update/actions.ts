"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assess } from "../../../../../lib/affordability/calculator";
import { validateIncomeAndExpenditure } from "../../../../../lib/affordability/validation";
import { createSnapshot } from "../../../../../lib/db";
import { getPersonaId } from "../../../../../lib/identity/persona-cookie";
import { getPersonaById } from "../../../../../lib/personas";
import { parseIncomeAndExpenditureFromFormData } from "../../../../../lib/update/parseFormData";
import type { UpdateSnapshotState } from "../../../../../lib/update/types";

export async function updateSnapshotAction(
  _prevState: UpdateSnapshotState | null,
  formData: FormData,
): Promise<UpdateSnapshotState> {
  const personaId = await getPersonaId();
  if (!personaId || !getPersonaById(personaId)) {
    return {
      ok: false,
      errors: [{ field: "_", message: "Please pick a persona first." }],
    };
  }

  const candidate = parseIncomeAndExpenditureFromFormData(formData);
  const validation = validateIncomeAndExpenditure(candidate);
  if (!validation.ok) {
    return { ok: false, errors: validation.errors };
  }

  const outcome = assess(validation.data);
  createSnapshot({
    customerId: personaId,
    ie: validation.data,
    outcome,
  });

  revalidatePath("/dashboard");
  revalidatePath("/history");
  redirect("/dashboard");
}
