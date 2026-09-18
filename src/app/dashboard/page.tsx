import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  FileSearch,
  FileText,
  FolderOpen,
  LogOut,
  UploadCloud,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

import { signOut } from "./actions";

function formatDate(dateValue: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateValue));
}

function ScoreCard({
  title,
  value,
  description,
  icon: Icon,
  accentClassName,
}: {
  title: string;
  value: string;
  description: string;
  icon: typeof FileText;
  accentClassName: string;
}) {
  return (
    <Card className="border-white/10 bg-slate-900/80">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div>
          <CardDescription className="text-slate-400">{title}</CardDescription>
          <CardTitle className="mt-2 text-3xl text-white">{value}</CardTitle>
        </div>
        <span className={`grid size-11 place-items-center rounded-xl ${accentClassName}`}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-400">{description}</p>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    resumesResult,
    analysesResult,
    jobMatchesResult,
    latestAnalysisResult,
    latestJobMatchResult,
    recentResumesResult,
  ] = await Promise.all([
    supabase.from("resumes").select("*", { count: "exact", head: true }),
    supabase.from("analyses").select("*", { count: "exact", head: true }),
    supabase.from("job_matches").select("*", { count: "exact", head: true }),
    supabase
      .from("analyses")
      .select("ats_score, created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("job_matches")
      .select("match_score, created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("resumes")
      .select("id, file_name, file_type, processing_status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const fullName =
    user.user_metadata.full_name?.trim() ||
    user.email?.split("@")[0] ||
    "there";

  const resumeCount = resumesResult.count ?? 0;
  const analysisCount = analysesResult.count ?? 0;
  const jobMatchCount = jobMatchesResult.count ?? 0;
  const latestAtsScore = latestAnalysisResult.data?.ats_score;
  const latestJobMatchScore = latestJobMatchResult.data?.match_score;
  const recentResumes = recentResumesResult.data ?? [];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid size-9 place-items-center rounded-xl bg-cyan-400 text-slate-950">
              <FileSearch className="size-5" aria-hidden="true" />
            </span>
            <span>AI Resume Analyser</span>
          </Link>

          <div className="flex items-center gap-3">
  <Button
    asChild
    className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
  >
    <Link href="/upload">
      <UploadCloud className="size-4" aria-hidden="true" />
      Upload resume
    </Link>
  </Button>

  <form action={signOut}>
    <Button
      type="submit"
      variant="outline"
      className="border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
    >
      <LogOut className="size-4" aria-hidden="true" />
      Logout
    </Button>
    </form>
</div>
</div>
</header>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section>
          <Badge className="border border-cyan-300/20 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/10">
            Your private workspace
          </Badge>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Welcome back, {fullName}.
              </h1>
              <p className="mt-3 max-w-2xl text-slate-300">
                Track your resume quality, ATS-style results, and job-match progress
                from one secure dashboard.
              </p>
            </div>

            <p className="flex items-center gap-2 text-sm text-slate-400">
              <CalendarDays className="size-4 text-cyan-300" aria-hidden="true" />
              Account created {formatDate(user.created_at)}
            </p>
          </div>
        </section>

        <section className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <ScoreCard
            title="Uploaded resumes"
            value={String(resumeCount)}
            description="Private PDF and DOCX documents"
            icon={FolderOpen}
            accentClassName="bg-cyan-300/10 text-cyan-200"
          />
          <ScoreCard
            title="Completed analyses"
            value={String(analysisCount)}
            description="ATS-style analysis reports"
            icon={BarChart3}
            accentClassName="bg-violet-400/10 text-violet-200"
          />
          <ScoreCard
            title="Latest ATS score"
            value={latestAtsScore === undefined ? "—" : `${latestAtsScore}/100`}
            description={
              latestAtsScore === undefined
                ? "Upload and analyse a resume to begin"
                : "Latest application-generated score"
            }
            icon={TrendingUp}
            accentClassName="bg-emerald-400/10 text-emerald-200"
          />
          <ScoreCard
            title="Latest job match"
            value={latestJobMatchScore === undefined ? "—" : `${latestJobMatchScore}%`}
            description={
              jobMatchCount === 0
                ? "Match a resume with a job description"
                : `${jobMatchCount} saved job match${jobMatchCount === 1 ? "" : "es"}`
            }
            icon={Target}
            accentClassName="bg-amber-300/10 text-amber-200"
          />
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <Card className="border-white/10 bg-slate-900/80">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="text-xl text-white">Recent resumes</CardTitle>
                <CardDescription className="mt-1 text-slate-400">
                  Your latest uploaded documents will appear here.
                </CardDescription>
              </div>
              <FileText className="size-5 text-cyan-300" aria-hidden="true" />
            </CardHeader>

            <CardContent>
              {recentResumes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/15 bg-white/5 px-5 py-10 text-center">
                  <FolderOpen className="mx-auto size-9 text-slate-500" aria-hidden="true" />
                  <h2 className="mt-4 font-semibold text-white">No resumes uploaded yet</h2>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">
                    Resume upload, validation, private storage, and processing are the
                    next project feature being added.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {recentResumes.map((resume) => (
                    <div
                      key={resume.id}
                      className="flex flex-col gap-2 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-white">{resume.file_name}</p>
                        <p className="mt-1 text-sm text-slate-400">
                          Uploaded {formatDate(resume.created_at)}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="w-fit border-cyan-300/20 text-cyan-200"
                      >
                        {resume.processing_status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-slate-900/80">
            <CardHeader>
              <span className="mb-2 grid size-11 place-items-center rounded-xl bg-cyan-300 text-slate-950">
                <Sparkles className="size-5" aria-hidden="true" />
              </span>
              <CardTitle className="text-xl text-white">Your analysis journey</CardTitle>
              <CardDescription className="text-slate-300">
                The application will progressively turn uploaded resumes into
                structured, explainable reports.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4 text-sm">
                {[
                  "Upload a validated PDF or DOCX resume",
                  "Extract text and identify resume sections",
                  "Calculate ATS-style and resume-health scores",
                  "Compare against a target job description",
                ].map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-cyan-300/10 text-xs font-semibold text-cyan-100">
                      {index + 1}
                    </span>
                    <span className="leading-6 text-slate-200">{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}