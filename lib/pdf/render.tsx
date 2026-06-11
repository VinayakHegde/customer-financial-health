import { renderToBuffer } from "@react-pdf/renderer";
import type { Snapshot } from "../affordability/types";
import { SnapshotPdf } from "./SnapshotPdf";

/**
 * Pure delegation wrapper around `@react-pdf/renderer`'s documented Node
 * helper `renderToBuffer`. The wrapper exists so the Route Handler and the
 * unit tests depend on one local function name; if the upstream API ever
 * renames `renderToBuffer`, this is the single edit site (tech-spec §S12
 * design + S021 D-152).
 *
 * `@react-pdf/renderer@4.5.1` (pinned exact in `package.json`) exports
 * `renderToBuffer(element: ReactElement<DocumentProps>) => Promise<Buffer>`
 * from the package root — verified at `/implement S12` against
 * `node_modules/@react-pdf/renderer/index.d.ts` line 790 and
 * `lib/react-pdf.js` line 367. No Chromium binary lands in
 * `node_modules/.bin/`; rasterisation goes via `@react-pdf/pdfkit`.
 */
export async function renderSnapshotPdfToBuffer(
  snapshot: Snapshot,
): Promise<Buffer> {
  return renderToBuffer(<SnapshotPdf snapshot={snapshot} />);
}
