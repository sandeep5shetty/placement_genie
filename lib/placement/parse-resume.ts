import mammoth from "mammoth";
import { extractText } from "unpdf";

const PDF_TYPE = "application/pdf";
const DOCX_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function isSupportedResumeFile(file: File) {
  const name = file.name.toLowerCase();
  return (
    file.type === PDF_TYPE ||
    file.type === DOCX_TYPE ||
    name.endsWith(".pdf") ||
    name.endsWith(".docx")
  );
}

function flattenText(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => flattenText(item)).join("\n");
  }
  return "";
}

function extractEmbeddedPdfStrings(bytes: Uint8Array) {
  const raw = Buffer.from(bytes).toString("latin1");
  const chunks: string[] = [];
  const pattern = /\((?:\\.|[^\\)]){2,120}\)/g;
  let match = pattern.exec(raw);
  while (match) {
    const inner = match[0]
      .slice(1, -1)
      .replaceAll("\\n", " ")
      .replaceAll("\\r", " ")
      .replaceAll(/\\[()]/g, "")
      .trim();
    if (/[A-Za-z]{3,}/.test(inner)) {
      chunks.push(inner);
    }
    match = pattern.exec(raw);
  }
  return chunks.join(" ");
}

async function extractPdfText(bytes: Uint8Array) {
  try {
    const result = await extractText(bytes, { mergePages: true });
    const text = flattenText(result.text).split("\0").join(" ").trim();
    if (text.length > 20) {
      return text;
    }
  } catch {
    /* scanned or encrypted PDFs fall through */
  }
  return extractEmbeddedPdfStrings(bytes).trim();
}

export async function extractResumeText(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const name = file.name.toLowerCase();

  if (file.type === PDF_TYPE || name.endsWith(".pdf")) {
    return extractPdfText(bytes);
  }

  if (file.type === DOCX_TYPE || name.endsWith(".docx")) {
    const result = await mammoth.extractRawText({
      buffer: Buffer.from(bytes),
    });
    return result.value;
  }

  throw new Error("Unsupported file type. Upload a PDF or DOCX resume.");
}
