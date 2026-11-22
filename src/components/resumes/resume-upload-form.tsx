"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  CircleAlert,
  FileText,
  LoaderCircle,
  Upload,
  X,
} from "lucide-react";

import {
  getResumeFileValidationError,
  MAX_RESUME_FILE_SIZE_LABEL,
  RESUME_FILE_INPUT_ACCEPT,
  SUPPORTED_RESUME_FORMATS_LABEL,
} from "@/lib/resume/file-validation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type Feedback =
  | { type: "error"; message: string }
  | { type: "success"; message: string }
  | null;

function formatFileSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function ResumeUploadForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);

  function clearSelectedFile() {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function selectFile(candidate: File | null) {
    setFeedback(null);

    if (!candidate) {
      return;
    }

    const validationError = getResumeFileValidationError(
      candidate.name,
      candidate.size,
      candidate.type,
    );

    if (validationError) {
      clearSelectedFile();
      setFeedback({ type: "error", message: validationError });
      return;
    }

    setFile(candidate);
  }

  function uploadResume() {
    if (!file) {
      setFeedback({
        type: "error",
        message: "Choose a resume before starting the upload.",
      });
      return;
    }

    setIsUploading(true);
    setProgress(0);
    setFeedback(null);

    const formData = new FormData();
    formData.append("file", file);

    const request = new XMLHttpRequest();
    request.open("POST", "/api/resumes/upload");

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    request.onerror = () => {
      setIsUploading(false);
      setFeedback({
        type: "error",
        message: "Network error. Check your connection and try again.",
      });
    };

    request.onload = () => {
      setIsUploading(false);

      let response: { error?: string } = {};

      try {
        response = JSON.parse(request.responseText) as { error?: string };
      } catch {
        response = {};
      }

      if (request.status >= 200 && request.status < 300) {
        setProgress(100);
        clearSelectedFile();
        router.refresh();
        setFeedback({
          type: "success",
          message: "Resume uploaded, stored privately, and text extracted successfully.",
        });
        return;
      }

      setFeedback({
        type: "error",
        message: response.error ?? "Upload failed. Please try again.",
      });
    };

    request.send(formData);
  }

  return (
    <div className="space-y-5">
      <Card className="border-slate-700 bg-slate-900/80">
        <CardContent className="p-6">
          <div
            className={`rounded-xl border-2 border-dashed p-10 text-center transition ${
              isDragging
                ? "border-cyan-300 bg-cyan-300/10"
                : "border-slate-700 bg-slate-950/40"
            }`}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              selectFile(event.dataTransfer.files.item(0));
            }}
          >
            <Upload className="mx-auto mb-4 size-10 text-cyan-300" />

            <h2 className="text-xl font-semibold text-white">
              Upload your resume
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
              Drag a resume file here, or choose one from your computer.
              Files stay private to your account.
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Supported: {SUPPORTED_RESUME_FORMATS_LABEL} · Maximum file size: {MAX_RESUME_FILE_SIZE_LABEL}
            </p>

            <input
              ref={inputRef}
              className="hidden"
              type="file"
              accept={RESUME_FILE_INPUT_ACCEPT}
              onChange={(event) => selectFile(event.target.files?.item(0) ?? null)}
            />

            <Button
              className="mt-6 bg-cyan-400 text-slate-950 hover:bg-cyan-300"
              type="button"
              onClick={() => inputRef.current?.click()}
            >
              Choose resume
            </Button>
          </div>

          {file ? (
            <div className="mt-5 flex items-center justify-between gap-4 rounded-lg border border-slate-700 bg-slate-950/60 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <FileText className="size-7 shrink-0 text-cyan-300" />
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{file.name}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>

              <Button
                aria-label="Remove selected file"
                className="shrink-0"
                disabled={isUploading}
                onClick={() => {
                  clearSelectedFile();
                  setFeedback(null);
                }}
                size="icon"
                type="button"
                variant="ghost"
              >
                <X className="size-5" />
              </Button>
            </div>
          ) : null}

          {isUploading ? (
            <div className="mt-5 space-y-2">
              <div className="flex justify-between text-sm text-slate-300">
                <span>Uploading securely…</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          ) : null}

          <Button
            className="mt-6 w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300"
            disabled={!file || isUploading}
            onClick={uploadResume}
            type="button"
          >
            {isUploading ? (
              <>
                <LoaderCircle className="animate-spin" />
                Processing resume
              </>
            ) : (
              <>
                <Upload />
                Upload and extract text
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {feedback?.type === "error" ? (
        <Alert className="border-red-500/40 bg-red-500/10 text-red-100">
          <CircleAlert className="text-red-300" />
          <AlertTitle>Upload failed</AlertTitle>
          <AlertDescription>{feedback.message}</AlertDescription>
        </Alert>
      ) : null}

      {feedback?.type === "success" ? (
        <Alert className="border-emerald-500/40 bg-emerald-500/10 text-emerald-100">
          <CheckCircle2 className="text-emerald-300" />
          <AlertTitle>Resume ready</AlertTitle>
          <AlertDescription>
            {feedback.message}{" "}
            <Link className="font-medium text-cyan-300 underline" href="/dashboard">
              View dashboard
            </Link>
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
