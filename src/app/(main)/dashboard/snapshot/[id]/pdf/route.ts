import { getSnapshotById } from "../../../../../../../lib/db";
import { getPersonaId } from "../../../../../../../lib/identity/persona-cookie";
import { renderSnapshotPdfToBuffer } from "../../../../../../../lib/pdf/render";
import { getPersonaById } from "../../../../../../../lib/personas";

/**
 * S12 — PDF export for an owned snapshot.
 *
 * `@react-pdf/renderer` calls into Node-only APIs (`Buffer`, font loading
 * via `fs`); pinning `runtime = 'nodejs'` here prevents a future global
 * default-runtime flip from silently breaking the route at import time.
 * Asserted by T68 via static import — see tech-spec §S12 design + S021
 * D-153.
 */
export const runtime = "nodejs";

/**
 * Persona-cookie gate, then ownership gate, then PDF render.
 *
 * Both gates are intentionally ordered before any work that would touch
 * `@react-pdf/renderer`: a 403 / 404 response must not trigger React
 * rendering, `Intl` allocation, or buffer accumulation. T70 / T71 spy on
 * `renderSnapshotPdfToBuffer` and assert zero calls on the deny arms; T74
 * spies on `console.*` and asserts zero IE digits, persona id, or snapshot
 * id are logged across one full GET.
 *
 * Forbidden (403) and Not Found (404) bodies match the tech-spec wire-text
 * exactly (`'Forbidden'`, `'Not Found'`); T70's parity assertion compares
 * the body strings between the cross-persona arm and the missing-id arm.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const personaId = await getPersonaId();
  if (!personaId || !getPersonaById(personaId)) {
    return new Response("Forbidden", { status: 403 });
  }

  const { id } = await params;
  const snapshot = getSnapshotById(id);
  if (!snapshot || snapshot.customerId !== personaId) {
    return new Response("Not Found", { status: 404 });
  }

  const buffer = await renderSnapshotPdfToBuffer(snapshot);

  console.log("pdf: rendered");

  const datePart = snapshot.takenAt.slice(0, 10);
  const filename = `financial-snapshot-${datePart}.pdf`;

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store, private",
    },
  });
}
