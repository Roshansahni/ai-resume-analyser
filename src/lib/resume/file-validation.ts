export const MAX_RESUME_FILE_SIZE = 5 * 1024 * 1024;
export const MAX_RESUME_FILE_SIZE_LABEL = "5 MB";

export const PDF_MIME_TYPE = "application/pdf";
export const DOCX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export type ResumeFileType = "pdf" | "docx";

export function getResumeFileType(
  fileName: string,
  mimeType: string,
): ResumeFileType | null {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (extension === "pdf" && mimeType === PDF_MIME_TYPE) {
    return "pdf";
  }

  if (extension === "docx" && mimeType === DOCX_MIME_TYPE) {
    return "docx";
  }

  return null;
}

export function getResumeFileValidationError(
  fileName: string,
  fileSize: number,
  mimeType: string,
): string | null {
  if (!fileName) {
    return "Choose a resume file first.";
  }

  if (fileSize === 0) {
    return "This file is empty. Choose a valid PDF or DOCX resume.";
  }

  if (fileSize > MAX_RESUME_FILE_SIZE) {
    return `Your resume must be ${MAX_RESUME_FILE_SIZE_LABEL} or smaller.`;
  }

  if (!getResumeFileType(fileName, mimeType)) {
    return "Only PDF and DOCX resume files are supported.";
  }

  return null;
}