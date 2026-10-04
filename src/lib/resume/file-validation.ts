export const MAX_RESUME_FILE_SIZE = 5 * 1024 * 1024;
export const MAX_RESUME_FILE_SIZE_LABEL = "5 MB";
export const SUPPORTED_RESUME_FORMATS_LABEL =
  "PDF, DOC, DOCX, TXT, MD, RTF, HTML, HTM, or ODT";

export const PDF_MIME_TYPE = "application/pdf";
export const DOC_MIME_TYPE = "application/msword";
export const DOCX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const TEXT_MIME_TYPE = "text/plain";
export const MARKDOWN_MIME_TYPE = "text/markdown";
export const RTF_MIME_TYPE = "application/rtf";
export const HTML_MIME_TYPE = "text/html";
export const ODT_MIME_TYPE = "application/vnd.oasis.opendocument.text";

export type ResumeFileType =
  | "pdf"
  | "doc"
  | "docx"
  | "txt"
  | "md"
  | "rtf"
  | "html"
  | "odt";

type ResumeFileDefinition = {
  extensions: readonly string[];
  mimeType: string;
  acceptedMimeTypes: readonly string[];
};

export const RESUME_FILE_DEFINITIONS: Record<
  ResumeFileType,
  ResumeFileDefinition
> = {
  pdf: {
    extensions: ["pdf"],
    mimeType: PDF_MIME_TYPE,
    acceptedMimeTypes: [PDF_MIME_TYPE],
  },
  doc: {
    extensions: ["doc"],
    mimeType: DOC_MIME_TYPE,
    acceptedMimeTypes: [DOC_MIME_TYPE, "application/octet-stream"],
  },
  docx: {
    extensions: ["docx"],
    mimeType: DOCX_MIME_TYPE,
    acceptedMimeTypes: [DOCX_MIME_TYPE, "application/zip", "application/octet-stream"],
  },
  txt: {
    extensions: ["txt"],
    mimeType: TEXT_MIME_TYPE,
    acceptedMimeTypes: [TEXT_MIME_TYPE, "application/octet-stream"],
  },
  md: {
    extensions: ["md", "markdown"],
    mimeType: MARKDOWN_MIME_TYPE,
    acceptedMimeTypes: [MARKDOWN_MIME_TYPE, TEXT_MIME_TYPE, "application/octet-stream"],
  },
  rtf: {
    extensions: ["rtf"],
    mimeType: RTF_MIME_TYPE,
    acceptedMimeTypes: [RTF_MIME_TYPE, "text/rtf", "application/octet-stream"],
  },
  html: {
    extensions: ["html", "htm"],
    mimeType: HTML_MIME_TYPE,
    acceptedMimeTypes: [HTML_MIME_TYPE, "application/xhtml+xml", "application/octet-stream"],
  },
  odt: {
    extensions: ["odt"],
    mimeType: ODT_MIME_TYPE,
    acceptedMimeTypes: [ODT_MIME_TYPE, "application/zip", "application/octet-stream"],
  },
};

export const RESUME_FILE_INPUT_ACCEPT = [
  ".pdf",
  ".doc",
  ".docx",
  ".txt",
  ".md",
  ".markdown",
  ".rtf",
  ".html",
  ".htm",
  ".odt",
  ...Object.values(RESUME_FILE_DEFINITIONS).flatMap(
    (definition) => definition.acceptedMimeTypes,
  ),
].join(",");

function extensionFromFileName(fileName: string) {
  const lastDot = fileName.lastIndexOf(".");
  return lastDot === -1 ? "" : fileName.slice(lastDot + 1).toLowerCase();
}

export function getResumeFileType(fileName: string): ResumeFileType | null {
  const extension = extensionFromFileName(fileName);

  return (
    (Object.entries(RESUME_FILE_DEFINITIONS).find(([, definition]) =>
      definition.extensions.includes(extension),
    )?.[0] as ResumeFileType | undefined) ?? null
  );
}

/** Browser MIME types are advisory; server-side signatures are authoritative. */
export function hasCompatibleResumeMimeType(
  fileType: ResumeFileType,
  mimeType: string,
) {
  const normalizedMimeType = mimeType.toLowerCase().trim();
  return (
    normalizedMimeType.length === 0 ||
    RESUME_FILE_DEFINITIONS[fileType].acceptedMimeTypes.includes(
      normalizedMimeType,
    )
  );
}

export function getResumeFileValidationError(
  fileName: string,
  fileSize: number,
  mimeType: string,
): string | null {
  if (!fileName) return "Choose a resume file first.";
  if (fileSize === 0) return "This file is empty. Choose a non-empty resume file.";
  if (fileSize > MAX_RESUME_FILE_SIZE) {
    return `Your resume must be ${MAX_RESUME_FILE_SIZE_LABEL} or smaller.`;
  }

  const fileType = getResumeFileType(fileName);
  if (!fileType) return `Supported formats: ${SUPPORTED_RESUME_FORMATS_LABEL}.`;
  if (!hasCompatibleResumeMimeType(fileType, mimeType)) {
    return "The file type does not match its extension. Choose the original resume file.";
  }

  return null;
}
