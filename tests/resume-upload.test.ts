import assert from "node:assert/strict";
import test from "node:test";

import AdmZip from "adm-zip";

import {
  extractResumeText,
  ResumeContentValidationError,
  validateResumeFileContent,
} from "../src/lib/resume/extract-text";
import {
  DOCX_MIME_TYPE,
  getResumeFileType,
  getResumeFileValidationError,
  MAX_RESUME_FILE_SIZE,
  ODT_MIME_TYPE,
  PDF_MIME_TYPE,
  RESUME_FILE_INPUT_ACCEPT,
} from "../src/lib/resume/file-validation";

const resumeText =
  "Avery Candidate\navery@example.com\n+91 9876543210\nSkills: TypeScript, React, SQL\nExperience: Built reliable web applications.";

function makeDocx() {
  const zip = new AdmZip();
  zip.addFile("[Content_Types].xml", Buffer.from("<Types />"));
  zip.addFile(
    "word/document.xml",
    Buffer.from(
      `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>${resumeText}</w:t></w:r></w:p></w:body></w:document>`,
    ),
  );
  return zip.toBuffer();
}

function makeOdt() {
  const zip = new AdmZip();
  zip.addFile("mimetype", Buffer.from(ODT_MIME_TYPE));
  zip.addFile(
    "content.xml",
    Buffer.from(
      `<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"><office:body><office:text><text:p>${resumeText}</text:p></office:text></office:body></office:document-content>`,
    ),
  );
  return zip.toBuffer();
}

function makePdf(text: string) {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${Buffer.byteLength(`BT /F1 12 Tf 72 720 Td (${text.replace(/[()\\]/g, "\\$&")}) Tj ET`)} >>\nstream\nBT /F1 12 Tf 72 720 Td (${text.replace(/[()\\]/g, "\\$&")}) Tj ET\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf);
}

test("keeps Markdown resumes working through the common extraction pipeline", async () => {
  const buffer = Buffer.from(`# Resume\n\n${resumeText}`);
  validateResumeFileContent("md", buffer);
  assert.match(await extractResumeText("md", buffer), /TypeScript/);
});

for (const [fileType, buffer] of [
  ["txt", Buffer.from(resumeText)],
  ["rtf", Buffer.from(`{\\rtf1\\ansi ${resumeText}}`)],
  ["html", Buffer.from(`<html><body><h1>Avery Candidate</h1><p>${resumeText}</p><script>ignored()</script></body></html>`)],
  ["docx", makeDocx()],
  ["odt", makeOdt()],
  ["pdf", makePdf(resumeText)],
] as const) {
  test(`extracts readable text from ${fileType.toUpperCase()}`, async () => {
    validateResumeFileContent(fileType, buffer);
    const text = await extractResumeText(fileType, buffer);
    assert.match(text, /Avery Candidate/);
    assert.match(text, /TypeScript/);
    if (fileType === "html") assert.doesNotMatch(text, /ignored\(\)/);
  });
}

test("reports when a PDF needs OCR instead of pretending it has readable text", async () => {
  const scannedPdf = makePdf(" ");
  validateResumeFileContent("pdf", scannedPdf);
  await assert.rejects(
    () => extractResumeText("pdf", scannedPdf),
    /OCR is required/i,
  );
});

test("rejects a DOCX archive that expands beyond the safe extraction limit", () => {
  const zip = new AdmZip();
  zip.addFile("word/document.xml", Buffer.alloc(15 * 1024 * 1024 + 1, "a"));

  assert.throws(
    () => validateResumeFileContent("docx", zip.toBuffer()),
    ResumeContentValidationError,
  );
});

test("recognises legacy DOC files and safely rejects corrupt DOC input during extraction", async () => {
  const corruptOle = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  validateResumeFileContent("doc", corruptOle);
  const originalConsoleError = console.error;
  console.error = () => undefined;

  try {
    await assert.rejects(() => extractResumeText("doc", corruptOle));
  } finally {
    console.error = originalConsoleError;
  }
});

test("rejects invalid, mismatched, empty, and oversized uploads", () => {
  assert.throws(
    () => validateResumeFileContent("pdf", Buffer.from("not a PDF")),
    ResumeContentValidationError,
  );
  assert.match(getResumeFileValidationError("resume.exe", 100, "application/octet-stream") ?? "", /Supported formats/);
  assert.match(getResumeFileValidationError("resume.pdf", 0, PDF_MIME_TYPE) ?? "", /empty/);
  assert.match(getResumeFileValidationError("resume.pdf", MAX_RESUME_FILE_SIZE + 1, PDF_MIME_TYPE) ?? "", /5 MB/);
  assert.match(getResumeFileValidationError("resume.pdf", 100, DOCX_MIME_TYPE) ?? "", /does not match/);
});

test("maps extensions and exposes every supported browser file-picker format", () => {
  assert.equal(getResumeFileType("candidate.pdf"), "pdf");
  assert.equal(getResumeFileType("candidate.doc"), "doc");
  assert.equal(getResumeFileType("candidate.docx"), "docx");
  assert.equal(getResumeFileType("candidate.txt"), "txt");
  assert.equal(getResumeFileType("candidate.md"), "md");
  assert.equal(getResumeFileType("candidate.rtf"), "rtf");
  assert.equal(getResumeFileType("candidate.htm"), "html");
  assert.equal(getResumeFileType("candidate.odt"), "odt");
  for (const extension of [".pdf", ".doc", ".docx", ".txt", ".md", ".rtf", ".html", ".odt"]) {
    assert.match(RESUME_FILE_INPUT_ACCEPT, new RegExp(extension.replace(".", "\\.")));
  }
});
