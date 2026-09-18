import "server-only";

import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";

import type { ResumeFileType } from "@/lib/resume/file-validation";

export class ResumeExtractionError extends Error {}

function cleanText(value: string) {
  return value
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractResumeText(
  fileType: ResumeFileType,
  buffer: Buffer,
) {
  try {
    let extractedText = "";

    if (fileType === "pdf") {
      const pdf = await getDocumentProxy(new Uint8Array(buffer));

      const result = await extractText(pdf, {
        mergePages: true,
      });

      extractedText = result.text;
    }

    if (fileType === "docx") {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    }

    const rawText = cleanText(extractedText);

    if (rawText.length < 30) {
      throw new ResumeExtractionError(
        "We could not find selectable text in this document. Upload a text-based PDF or DOCX file.",
      );
    }

    return rawText;
  } catch (error) {
    if (error instanceof ResumeExtractionError) {
      throw error;
    }

    console.error("Resume text extraction failed:", error);

    throw new ResumeExtractionError(
      "This document could not be read. It may be damaged, password-protected, or image-only.",
    );
  }
}