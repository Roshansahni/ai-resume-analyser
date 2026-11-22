import Link from "next/link";
import { Building2, CheckCircle2, CircleAlert, Plus, Trash2 } from "lucide-react";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/server";

import { createJobDescription, deleteJobDescription } from "./actions";

function messageFor(error?: string, status?: string) {
  const errors: Record<string, string> = {
    "description-required": "Paste a job description before saving.",
    "description-too-long": "Keep the job description under 20,000 characters.",
    "field-too-long": "Keep the job title and company name under 120 characters.",
    "job-required": "Choose a valid job description first.",
    "save-failed": "The job description could not be saved. Please try again.",
    "delete-failed": "The job description could not be deleted. Please try again.",
  };

  const successes: Record<string, string> = {
    saved: "Job description saved successfully.",
    deleted: "Job description deleted successfully.",
  };

  return error
    ? { type: "error" as const, text: errors[error] ?? "The request could not be completed." }
    : status
      ? { type: "success" as const, text: successes[status] ?? "Changes saved successfully." }
      : null;
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; status?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/jobs");

  const { data: jobsData } = await supabase
    .from("job_descriptions")
    .select("id, title, company, description, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const jobs = jobsData ?? [];
  const feedback = messageFor(params.error, params.status);

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-cyan-300">Target roles</p>
            <h1 className="mt-1 text-3xl font-bold">Job descriptions</h1>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </header>

        {feedback ? (
          <Alert
            aria-live="polite"
            className={`mb-6 ${feedback.type === "error" ? "border-red-500/40 bg-red-500/10 text-red-100" : "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"}`}
          >
            {feedback.type === "error" ? <CircleAlert className="text-red-300" /> : <CheckCircle2 className="text-emerald-300" />}
            <AlertTitle>{feedback.type === "error" ? "Unable to update jobs" : "Job list updated"}</AlertTitle>
            <AlertDescription>{feedback.text}</AlertDescription>
          </Alert>
        ) : null}

        <Card className="border-slate-800 bg-slate-900">
          <CardHeader><CardTitle>Add a job description</CardTitle></CardHeader>
          <CardContent>
            <form action={createJobDescription} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm text-slate-200" htmlFor="job-title">Job title <span className="text-slate-500">(optional)</span></label>
                  <Input className="bg-slate-950 text-white" id="job-title" maxLength={120} name="title" placeholder="Job title" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-slate-200" htmlFor="company">Company <span className="text-slate-500">(optional)</span></label>
                  <Input className="bg-slate-950 text-white" id="company" maxLength={120} name="company" placeholder="Company" />
                </div>
              </div>
              <label className="block text-sm text-slate-200" htmlFor="job-description">Job description</label>
              <Textarea
                className="min-h-48 bg-slate-950 text-white"
                id="job-description"
                maxLength={20000}
                name="description"
                placeholder="Paste the complete job description here..."
                required
              />
              <Button className="bg-cyan-400 text-slate-950 hover:bg-cyan-300" type="submit">
                <Plus /> Save job description
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 space-y-4">
          {jobs.map((job) => (
            <Card className="border-slate-800 bg-slate-900" key={job.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>{job.title || "Untitled role"}</CardTitle>
                  <p className="mt-1 flex items-center gap-2 text-sm text-slate-400">
                    <Building2 className="size-4" /> {job.company || "Company not specified"}
                  </p>
                </div>
                <form action={deleteJobDescription}>
                  <input name="jobId" type="hidden" value={job.id} />
                  <Button aria-label={`Delete ${job.title || "job description"}`} size="icon" type="submit" variant="destructive">
                    <Trash2 />
                  </Button>
                </form>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3 whitespace-pre-wrap text-sm text-slate-300">
                  {job.description}
                </p>
              </CardContent>
            </Card>
          ))}

          {jobs.length === 0 ? (
            <Card className="border-slate-800 bg-slate-900">
              <CardContent className="py-12 text-center text-slate-400">
                No job descriptions saved yet. Add one above to compare it with a resume.
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </main>
  );
}
