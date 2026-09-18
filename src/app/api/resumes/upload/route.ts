import { randomUUID } from "node:crypto";

import {
  DOCX_MIME_TYPE,
  getResumeFileType,
  getResumeFileValidationError,
  PDF_MIME_TYPE,
} from "@/lib/resume/file-validation";
import {
  extractResumeText,
  ResumeExtractionError,
} from "@/lib/resume/extract-text";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(error: string, status: number) {
  return Response.json({ error }, { status });
}

function hasPdfSignature(buffer: Buffer) {
  return buffer.subarray(0, 5).toString() === "%PDF-";
}

function hasDocxSignature(buffer: Buffer) {
  const zipSignature = buffer.subarray(0, 4).toString("hex");
  const isZip =
    zipSignature === "504b0304" ||
    zipSignature === "504b0506" ||
    zipSignature === "504b0708";

  return (
    isZip &&
    buffer.includes(Buffer.from("[Content_Types].xml")) &&
    buffer.includes(Buffer.from("word/document.xml"))
  );
}

function createSafeFileName(fileName: string) {
  const cleaned = fileName
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(-100);

  return cleaned || "resume";
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return jsonError("You must be signed in to upload a resume.", 401);
    }

    const formData = await request.formData();
    const uploadedFile = formData.get("file");

    if (!(uploadedFile instanceof File)) {
      return jsonError("Choose a resume file before uploading.", 400);
    }

    const validationError = getResumeFileValidationError(
      uploadedFile.name,
      uploadedFile.size,
      uploadedFile.type,
    );

    if (validationError) {
      return jsonError(validationError, 400);
    }

    const fileType = getResumeFileType(
      uploadedFile.name,
      uploadedFile.type,
    );

    if (!fileType) {
      return jsonError("Only PDF and DOCX resume files are supported.", 400);
    }

    const buffer = Buffer.from(await uploadedFile.arrayBuffer());

    if (fileType === "pdf" && !hasPdfSignature(buffer)) {
      return jsonError("This file is not a valid PDF document.", 400);
    }

    if (fileType === "docx" && !hasDocxSignature(buffer)) {
      return jsonError("This file is not a valid DOCX document.", 400);
    }

    const rawText = await extractResumeText(fileType, buffer);

    const safeFileName = createSafeFileName(uploadedFile.name);
    const storagePath = `${user.id}/${randomUUID()}-${safeFileName}`;

    const contentType =
      fileType === "pdf" ? PDF_MIME_TYPE : DOCX_MIME_TYPE;

    const { error: storageError } = await supabase.storage
      .from("resumes")
      .upload(storagePath, buffer, {
        contentType,
        upsert: false,
      });

    if (storageError) {
      return jsonError(
        "Your file could not be saved securely. Please try again.",
        500,
      );
    }

    const { data: resume, error: databaseError } = await supabase
      .from("resumes")
      .insert({
        user_id: user.id,
        file_name: uploadedFile.name,
        file_url: storagePath,
        file_type: fileType,
        file_size_bytes: uploadedFile.size,
        raw_text: rawText,
        parsed_data: {},
        processing_status: "completed",
      })
      .select("id, file_name, file_type, file_size_bytes, processing_status, created_at")
      .single();

    if (databaseError) {
      await supabase.storage.from("resumes").remove([storagePath]);

      return jsonError(
        "The uploaded file was removed because its resume record could not be created.",
        500,
      );
    }

    return Response.json({ resume }, { status: 201 });
  } catch (error) {
    if (error instanceof ResumeExtractionError) {
      return jsonError(error.message, 422);
    }

    return jsonError("Something went wrong while uploading your resume.", 500);
  }
}