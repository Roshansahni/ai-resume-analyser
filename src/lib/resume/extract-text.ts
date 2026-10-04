import AdmZip from "adm-zip";
import { load } from "cheerio";
import mammoth from "mammoth";
import parseRtf from "rtf-parser";
import { extractText, getDocumentProxy } from "unpdf";
import WordExtractor from "word-extractor";

import type { ResumeFileType } from "@/lib/resume/file-validation";

const MINIMUM_RESUME_TEXT_LENGTH = 30;
const MAX_EXTRACTED_TEXT_LENGTH = 1_000_000;
const MAX_ARCHIVE_UNCOMPRESSED_BYTES = 15 * 1024 * 1024;

export class ResumeExtractionError extends Error {}
export class ResumeContentValidationError extends Error {}

function cleanText(value: string) {
  return value
    .replace(/\u0000/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\t\f\v ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_EXTRACTED_TEXT_LENGTH);
}

function decodeText(buffer: Buffer) {
  if (buffer.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf]))) {
    return new TextDecoder("utf-8").decode(buffer.subarray(3));
  }
  if (buffer.subarray(0, 2).equals(Buffer.from([0xff, 0xfe]))) {
    return new TextDecoder("utf-16le").decode(buffer.subarray(2));
  }
  if (buffer.subarray(0, 2).equals(Buffer.from([0xfe, 0xff]))) {
    const copy = Buffer.from(buffer.subarray(2));
    for (let index = 0; index + 1 < copy.length; index += 2) {
      [copy[index], copy[index + 1]] = [copy[index + 1], copy[index]];
    }
    return new TextDecoder("utf-16le").decode(copy);
  }
  return new TextDecoder("utf-8").decode(buffer);
}

function isTextLike(buffer: Buffer) {
  if (buffer.includes(0)) return false;
  const text = decodeText(buffer);
  if (!text.trim()) return false;
  const printable = [...text].filter((character) => {
    const code = character.charCodeAt(0);
    return code >= 32 || character === "\n" || character === "\r" || character === "\t";
  }).length;
  return printable / Math.max(text.length, 1) > 0.9;
}

function isZip(buffer: Buffer) {
  const signature = buffer.subarray(0, 4).toString("hex");
  return ["504b0304", "504b0506", "504b0708"].includes(signature);
}

function readSafeZip(buffer: Buffer, requiredEntry: string) {
  if (!isZip(buffer)) return null;

  try {
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();
    let uncompressedSize = 0;

    for (const entry of entries) {
      if (
        entry.entryName.startsWith("/") ||
        entry.entryName.split("/").includes("..") ||
        (entry.header.flags & 0x1) !== 0
      ) {
        return null;
      }
      uncompressedSize += entry.header.size;
      if (uncompressedSize > MAX_ARCHIVE_UNCOMPRESSED_BYTES) return null;
    }

    return zip.getEntry(requiredEntry) ? zip : null;
  } catch {
    return null;
  }
}

export function validateResumeFileContent(fileType: ResumeFileType, buffer: Buffer) {
  const startsWith = (value: string) =>
    buffer.subarray(0, value.length).toString("ascii") === value;
  const trimmedText = () => decodeText(buffer).trimStart();

  switch (fileType) {
    case "pdf":
      if (!startsWith("%PDF-")) throw new ResumeContentValidationError("This file is not a valid PDF document.");
      return;
    case "doc":
      if (!buffer.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))) {
        throw new ResumeContentValidationError("This file is not a valid legacy Word DOC document.");
      }
      return;
    case "docx":
      if (!readSafeZip(buffer, "word/document.xml")) {
        throw new ResumeContentValidationError("This file is not a valid DOCX document.");
      }
      return;
    case "odt": {
      const zip = readSafeZip(buffer, "content.xml");
      if (!zip || zip.readAsText("mimetype") !== "application/vnd.oasis.opendocument.text") {
        throw new ResumeContentValidationError("This file is not a valid OpenDocument Text (ODT) file.");
      }
      return;
    }
    case "rtf":
      if (!trimmedText().startsWith("{\\rtf")) {
        throw new ResumeContentValidationError("This file is not a valid RTF document.");
      }
      return;
    case "html":
      if (!isTextLike(buffer) || !/<(?:!doctype|html|head|body|main|section|article|div|p|h[1-6]|table)\b/i.test(trimmedText())) {
        throw new ResumeContentValidationError("This file is not a valid HTML document.");
      }
      return;
    case "txt":
    case "md":
      if (!isTextLike(buffer)) {
        throw new ResumeContentValidationError("This file does not contain readable text.");
      }
  }
}

function extractRtfText(value: string) {
  return new Promise<string>((resolve, reject) => {
    parseRtf.string(value, (error, document) => {
      if (error) {
        reject(error);
        return;
      }
      const textFromNode = (node: { value?: string; content?: unknown[] }): string => {
        if (typeof node.value === "string") return node.value;
        if (!Array.isArray(node.content)) return "";
        return node.content
          .map((child) => textFromNode(child as { value?: string; content?: unknown[] }))
          .join("");
      };
      resolve(document.content.map((node) => textFromNode(node)).join("\n"));
    });
  });
}

function extractHtmlText(value: string) {
  const document = load(value);
  document("script, style, noscript, template, iframe, object, embed").remove();
  document("br").replaceWith("\n");
  document("p, div, li, tr, h1, h2, h3, h4, h5, h6").each((_, element) => {
    document(element).append("\n");
  });
  return document.root().text();
}

function extractOdtText(buffer: Buffer) {
  const zip = readSafeZip(buffer, "content.xml");
  if (!zip) throw new Error("Invalid ODT archive");
  const xml = zip.readAsText("content.xml");
  const withLineBreaks = xml
    .replace(/<text:(?:p|h)\b[^>]*>/g, "\n")
    .replace(/<text:line-break\s*\/?\s*>/g, "\n")
    .replace(/<text:tab\s*\/?\s*>/g, " ");
  return load(withLineBreaks, { xmlMode: true }).root().text();
}

export async function extractResumeText(fileType: ResumeFileType, buffer: Buffer) {
  try {
    let extractedText = "";

    switch (fileType) {
      case "pdf": {
        const pdf = await getDocumentProxy(new Uint8Array(buffer));
        extractedText = (await extractText(pdf, { mergePages: true })).text;
        break;
      }
      case "docx":
        extractedText = (await mammoth.extractRawText({ buffer })).value;
        break;
      case "doc": {
        const document = await new WordExtractor().extract(buffer);
        extractedText = document.getBody();
        break;
      }
      case "txt":
      case "md":
        extractedText = decodeText(buffer);
        break;
      case "rtf":
        extractedText = await extractRtfText(decodeText(buffer));
        break;
      case "html":
        extractedText = extractHtmlText(decodeText(buffer));
        break;
      case "odt":
        extractedText = extractOdtText(buffer);
        break;
    }

    const rawText = cleanText(extractedText);
    if (rawText.length < MINIMUM_RESUME_TEXT_LENGTH) {
      if (fileType === "pdf") {
        throw new ResumeExtractionError(
          "This PDF appears to be scanned or image-only. OCR is required before it can be analysed.",
        );
      }
      throw new ResumeExtractionError(
        "We could not extract enough readable text from this document. It may be empty, damaged, or password-protected.",
      );
    }

    return rawText;
  } catch (error) {
    if (error instanceof ResumeExtractionError) throw error;
    console.error("Resume text extraction failed", { fileType, error });
    throw new ResumeExtractionError(
      "This document could not be read. It may be damaged, password-protected, or unsupported.",
    );
  }
}
