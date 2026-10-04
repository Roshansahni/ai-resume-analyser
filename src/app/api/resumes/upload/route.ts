import { randomUUID } from "node:crypto";

import {
  getResumeFileType,
  getResumeFileValidationError,
  RESUME_FILE_DEFINITIONS,
  SUPPORTED_RESUME_FORMATS_LABEL,
} from "@/lib/resume/file-validation";
import {
  extractResumeText,
  ResumeContentValidationError,
  ResumeExtractionError,
  validateResumeFileContent,
} from "@/lib/resume/extract-text";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(error: string, status: number) {
  return Response.json({ error }, { status });
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

    const fileType = getResumeFileType(uploadedFile.name);

    if (!fileType) {
      return jsonError(`Supported formats: ${SUPPORTED_RESUME_FORMATS_LABEL}.`, 400);
    }

    const buffer = Buffer.from(await uploadedFile.arrayBuffer());
    validateResumeFileContent(fileType, buffer);

    const rawText = await extractResumeText(fileType, buffer);

    const safeFileName = createSafeFileName(uploadedFile.name);
    const storagePath = `${user.id}/${randomUUID()}-${safeFileName}`;

    const contentType = RESUME_FILE_DEFINITIONS[fileType].mimeType;

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
        file_type: contentType,
        file_size_bytes: uploadedFile.size,
        raw_text: rawText,
        parsed_data: {},
        processing_status: "completed",
      })
      .select("id, file_name, file_type, file_size_bytes, processing_status, created_at")
      .single();

    if (databaseError) {
      console.error("Resume database insert failed", { code: databaseError.code });
      await supabase.storage.from("resumes").remove([storagePath]);
      return jsonError(
        "The uploaded file was removed because its resume record could not be created.",
        500,
      );
    }

    return Response.json({ resume }, { status: 201 });
  } catch (error) {
    if (error instanceof ResumeContentValidationError) {
      return jsonError(error.message, 400);
    }

    if (error instanceof ResumeExtractionError) {
      return jsonError(error.message, 422);
    }

    return jsonError("Something went wrong while uploading your resume.", 500);
  }
}
