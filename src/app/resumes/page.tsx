import Link from "next/link";
import { CheckCircle2, CircleAlert, Download, FileText, Trash2, Upload } from "lucide-react";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

import { deleteResume, downloadResume } from "./actions";

function messageFor(error?: string, status?: string) {
  const errors: Record<string, string> = {
    "resume-required": "Choose a valid resume first.",
    "resume-not-found": "That resume is no longer available.",
    "download-failed": "A secure download link could not be created. Please try again.",
    "delete-failed": "The resume record could not be deleted. Please try again.",
  };

  const successes: Record<string, string> = {
    deleted: "Resume deleted successfully.",
    "deleted-with-warning": "The resume record was deleted, but its private file could not be cleaned up automatically.",
  };

  return error
    ? { type: "error" as const, text: errors[error] ?? "The request could not be completed." }
    : status
      ? { type: "success" as const, text: successes[status] ?? "Changes saved successfully." }
      : null;
}

export default async function ResumesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; status?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/resumes");

  const { data: resumesData } = await supabase
    .from("resumes")
    .select("id, file_name, file_type, file_size_bytes, processing_status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const resumes = resumesData ?? [];
  const feedback = messageFor(params.error, params.status);

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-cyan-300">Private document library</p>
            <h1 className="mt-1 text-3xl font-bold">Your resumes</h1>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button asChild className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
              <Link href="/upload"><Upload /> Upload resume</Link>
            </Button>
          </div>
        </header>

        {feedback ? (
          <Alert
            aria-live="polite"
            className={`mb-6 ${feedback.type === "error" ? "border-red-500/40 bg-red-500/10 text-red-100" : "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"}`}
          >
            {feedback.type === "error" ? <CircleAlert className="text-red-300" /> : <CheckCircle2 className="text-emerald-300" />}
            <AlertTitle>{feedback.type === "error" ? "Unable to update resume" : "Resume library updated"}</AlertTitle>
            <AlertDescription>{feedback.text}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-4">
          {resumes.map((resume) => (
            <Card className="border-slate-800 bg-slate-900" key={resume.id}>
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="text-cyan-300" />
                  <div>
                    <CardTitle>{resume.file_name}</CardTitle>
                    <p className="mt-1 text-sm text-slate-400">
                      {new Date(resume.created_at).toLocaleDateString("en-IN")} ·{" "}
                      {(resume.file_size_bytes / 1024 / 1024).toFixed(2)} MB ·{" "}
                      {resume.processing_status}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={downloadResume}>
                    <input name="resumeId" type="hidden" value={resume.id} />
                    <Button aria-label={`Download ${resume.file_name}`} size="icon" type="submit" variant="outline">
                      <Download />
                    </Button>
                  </form>
                  <form action={deleteResume}>
                    <input name="resumeId" type="hidden" value={resume.id} />
                    <Button aria-label={`Delete ${resume.file_name}`} size="icon" type="submit" variant="destructive">
                      <Trash2 />
                    </Button>
                  </form>
                  <Button asChild>
                    <Link href={`/analysis?resume=${resume.id}`}>Analyse</Link>
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}

          {resumes.length === 0 ? (
            <Card className="border-slate-800 bg-slate-900">
              <CardContent className="py-12 text-center text-slate-400">
                No resumes uploaded yet.
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </main>
  );
}
