"use client";

import { useTransition } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BarChart3, BriefcaseBusiness, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

import { runAtsAnalysis, runJobMatch } from "./actions";

type ResumeOption = {
  id: string;
  file_name: string;
};

type JobOption = {
  id: string;
  title: string | null;
  company: string | null;
};

type SubmitButtonProps = {
  busyLabel: string;
  children: React.ReactNode;
  disabled?: boolean;
};

function SubmitButton({ busyLabel, children, disabled }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
      disabled={disabled || pending}
      type="submit"
    >
      {pending ? (
        <>
          <LoaderCircle className="animate-spin" aria-hidden="true" />
          {busyLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

export function AnalysisControls({
  resumes,
  jobs,
  resumeId,
  jobId,
  hasAnalysis,
}: {
  resumes: ResumeOption[];
  jobs: JobOption[];
  resumeId: string;
  jobId?: string;
  hasAnalysis: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, startTransition] = useTransition();

  function selectWorkspace(nextResumeId: string, nextJobId?: string) {
    const params = new URLSearchParams(searchParams.toString());

    params.set("resume", nextResumeId);
    if (nextJobId) {
      params.set("job", nextJobId);
    } else {
      params.delete("job");
    }

    // A saved report belongs to a specific resume (and a match to a specific
    // job). Never carry stale report IDs across a new selection.
    params.delete("analysis");
    params.delete("match");
    params.delete("error");
    params.delete("ai");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <section className="grid gap-6 lg:grid-cols-2" aria-busy={isNavigating}>
      <div className="rounded-xl border border-white/10 bg-slate-900/80">
        <div className="p-6 pb-0">
          <h2 className="text-lg font-semibold">Run ATS analysis</h2>
          <p className="mt-1 text-sm text-slate-400">
            Select a resume to load its latest saved report, then analyse it in
            one click when needed.
          </p>
        </div>
        <div className="p-6">
          <form action={runAtsAnalysis} className="flex flex-col gap-3 sm:flex-row">
            <select
              aria-label="Resume to analyse"
              className="h-9 min-w-0 flex-1 rounded-lg border border-white/15 bg-slate-950 px-3 text-sm text-white disabled:cursor-wait disabled:opacity-60"
              disabled={isNavigating}
              name="resumeId"
              onChange={(event) => selectWorkspace(event.target.value, jobId)}
              value={resumeId}
            >
              {resumes.map((resume) => (
                <option key={resume.id} value={resume.id}>
                  {resume.file_name}
                </option>
              ))}
            </select>
            <SubmitButton busyLabel="Loading report…" disabled={isNavigating}>
              <BarChart3 aria-hidden="true" />
              {hasAnalysis ? "Open latest report" : "Analyse resume"}
            </SubmitButton>
          </form>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-900/80">
        <div className="p-6 pb-0">
          <h2 className="text-lg font-semibold">Compare with a job</h2>
          <p className="mt-1 text-sm text-slate-400">
            Match the selected resume with one saved job description.
          </p>
        </div>
        <div className="p-6">
          {jobs.length === 0 ? (
            <p className="text-sm text-slate-400">
              Add a role in <Link className="text-cyan-300 underline" href="/jobs">Jobs</Link> before matching.
            </p>
          ) : (
            <form action={runJobMatch} className="grid gap-3 sm:grid-cols-2">
              <select
                aria-label="Resume to match"
                className="h-9 rounded-lg border border-white/15 bg-slate-950 px-3 text-sm text-white disabled:cursor-wait disabled:opacity-60"
                disabled={isNavigating}
                name="resumeId"
                onChange={(event) => selectWorkspace(event.target.value, jobId)}
                value={resumeId}
              >
                {resumes.map((resume) => (
                  <option key={resume.id} value={resume.id}>
                    {resume.file_name}
                  </option>
                ))}
              </select>
              <select
                aria-label="Job to match"
                className="h-9 rounded-lg border border-white/15 bg-slate-950 px-3 text-sm text-white disabled:cursor-wait disabled:opacity-60"
                disabled={isNavigating}
                name="jobId"
                onChange={(event) => selectWorkspace(resumeId, event.target.value)}
                value={jobId ?? jobs[0]?.id ?? ""}
              >
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title || "Untitled role"}
                    {job.company ? ` — ${job.company}` : ""}
                  </option>
                ))}
              </select>
              <div className="sm:col-span-2">
                <SubmitButton busyLabel="Loading match…" disabled={isNavigating}>
                  <BriefcaseBusiness aria-hidden="true" />
                  Open job match
                </SubmitButton>
              </div>
            </form>
          )}
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {isNavigating ? "Loading the selected resume report." : ""}
      </p>
    </section>
  );
}
