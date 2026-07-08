// Client-only PDF text extraction using pdfjs-dist.
export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // Worker URL — Vite handles ?url import
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.mjs?url")).default;
  (pdfjs as any).GlobalWorkerOptions.workerSrc = workerUrl;

  const buf = await file.arrayBuffer();
  const doc = await (pdfjs as any).getDocument({ data: buf }).promise;
  let out = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    out += content.items.map((it: any) => it.str).join(" ") + "\n\n";
  }
  return out.trim();
}
