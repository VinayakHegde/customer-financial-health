import { PDFParse } from "pdf-parse";

/**
 * Extracts concatenated plain text from a PDF buffer produced by
 * `@react-pdf/renderer`'s `renderToBuffer`. Used by T72 / T73 to assert
 * required-content **presence** in the PDF (not layout, not byte equality —
 * per TEST_PLAN §1 stretch-discipline rule 2).
 *
 * The single-function shape lets tests call `pdfTextExtractor(buffer)`
 * without managing the underlying `PDFParse` lifecycle. `destroy()` is
 * invoked unconditionally inside a `finally` so a malformed buffer cannot
 * leak a worker handle into subsequent tests.
 */
export async function pdfTextExtractor(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}
