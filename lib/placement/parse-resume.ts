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

export async function extractResumeText(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();

  if (file.type === PDF_TYPE || name.endsWith(".pdf")) {
    const { text } = await extractText(new Uint8Array(buffer), {
      mergePages: true,
    });
    return Array.isArray(text) ? text.join("\n") : text;
  }

  if (file.type === DOCX_TYPE || name.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  throw new Error("Unsupported file type. Upload a PDF or DOCX resume.");
}
