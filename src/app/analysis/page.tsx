import Link from "next/link";
import { BarChart3, BriefcaseBusiness, CheckCircle2 } from "lucide-react";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

import { runAtsAnalysis, runJobMatch } from "./actions";

export default async function AnalysisPage({
  searchParams,
}: {
  searchParams: Promise<{ resume?: string; job?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [resumesResult, jobsResult] = await Promise.all([
  supabase
    .from("resumes")
    .select("id, file_name")
    .order("created_at", { ascending: false }),
  supabase
    .from("job_descriptions")
    .select("id, title, company")
    .order("created_at", { ascending: false }),
]);

const resumes = resumesResult.data ?? [];
const jobs = jobsResult.data ?? [];

  const resumeId = params.resume ?? resumes[0]?.id;
  const jobId = params.job ?? jobs[0]?.id;

  const [{ data: analysis }, { data: match }] = await Promise.all([
    resumeId
      ? supabase.from("analyses").select("*").eq("resume_id", resumeId).order("created_at", { ascending: false }).limit(1).maybeSingle()
      : Promise.resolve({ data: null }),
    resumeId && jobId
      ? supabase.from("job_matches").select("*").eq("resume_id", resumeId).eq("job_description_id", jobId).order("created_at", { ascending: false }).limit(1).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const strengths = (analysis?.strengths ?? []) as string[];
  const weaknesses = (analysis?.weaknesses ?? []) as string[];
  const suggestions = (analysis?.suggestions ?? []) as string[];
  const matchedSkills = (match?.matched_skills ?? []) as string[];
  const missingSkills = (match?.missing_skills ?? []) as string[];
  const recommendations = (match?.recommendations ?? []) as string[];

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-cyan-300">Explainable scoring</p>
            <h1 className="mt-1 text-3xl font-bold">Resume analysis</h1>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="outline"><Link href="/resumes">Resumes</Link></Button>
            <Button asChild variant="outline"><Link href="/jobs">Jobs</Link></Button>
          </div>
        </header>

        {resumes.length === 0 ? (
          <Card className="border-slate-800 bg-slate-900">
            <CardContent className="py-12 text-center">
              Upload a resume before running analysis.
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="border-slate-800 bg-slate-900">
              <CardHeader><CardTitle>Run ATS analysis</CardTitle></CardHeader>
              <CardContent>
                <form action={runAtsAnalysis} className="flex flex-col gap-3 sm:flex-row">
                  <select className="h-10 flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 text-white" defaultValue={resumeId} name="resumeId">
                    {resumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.file_name}</option>)}
                  </select>
                  <Button className="bg-cyan-400 text-slate-950 hover:bg-cyan-300" type="submit">
                    <BarChart3 /> Analyse resume
                  </Button>
                </form>
              </CardContent>
            </Card>

            {analysis ? (
              <section className="mt-6 grid gap-5 lg:grid-cols-2">
                <Card className="border-cyan-400/30 bg-slate-900">
                  <CardHeader>
                    <CardTitle className="text-4xl text-cyan-300">{analysis.ats_score}/100</CardTitle>
                    <p className="text-slate-400">Overall ATS score</p>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3 text-sm text-slate-300">
                    <span>Keywords: {analysis.keyword_score}</span>
                    <span>Skills: {analysis.skill_score}</span>
                    <span>Experience: {analysis.experience_score}</span>
                    <span>Education: {analysis.education_score}</span>
                    <span>Formatting: {analysis.formatting_score}</span>
                    <span>Projects: {analysis.project_score}</span>
                  </CardContent>
                </Card>

                <Card className="border-slate-800 bg-slate-900">
                  <CardHeader><CardTitle>Suggestions</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm text-slate-300">
                    {suggestions.map((item) => <p key={item}>• {item}</p>)}
                  </CardContent>
                </Card>

                <Card className="border-slate-800 bg-slate-900">
                  <CardHeader><CardTitle>Strengths</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm text-emerald-200">
                    {strengths.map((item) => <p key={item}><CheckCircle2 className="mr-2 inline size-4" />{item}</p>)}
                  </CardContent>
                </Card>

                <Card className="border-slate-800 bg-slate-900">
                  <CardHeader><CardTitle>Areas to improve</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm text-amber-200">
                    {weaknesses.map((item) => <p key={item}>• {item}</p>)}
                  </CardContent>
                </Card>
              </section>
            ) : null}

            <Card className="mt-6 border-slate-800 bg-slate-900">
              <CardHeader><CardTitle>Compare with a job description</CardTitle></CardHeader>
              <CardContent>
                {jobs.length === 0 ? (
                  <p className="text-slate-400">Create a job description first.</p>
                ) : (
                  <form action={runJobMatch} className="grid gap-3 sm:grid-cols-3">
                    <select className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-white" defaultValue={resumeId} name="resumeId">
                      {resumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.file_name}</option>)}
                    </select>
                    <select className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-white" defaultValue={jobId} name="jobId">
                      {jobs.map((job) => <option key={job.id} value={job.id}>{job.title || "Untitled role"} {job.company ? `— ${job.company}` : ""}</option>)}
                    </select>
                    <Button className="bg-cyan-400 text-slate-950 hover:bg-cyan-300" type="submit">
                      <BriefcaseBusiness /> Match job
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            {match ? (
              <section className="mt-6 grid gap-5 lg:grid-cols-2">
                <Card className="border-cyan-400/30 bg-slate-900">
                  <CardHeader>
                    <CardTitle className="text-4xl text-cyan-300">{match.match_score}%</CardTitle>
                    <p className="text-slate-400">Job-match score</p>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {matchedSkills.map((skill) => <Badge className="bg-emerald-400/15 text-emerald-200" key={skill}>{skill}</Badge>)}
                    {missingSkills.map((skill) => <Badge className="bg-red-400/15 text-red-200" key={skill}>{skill}</Badge>)}
                  </CardContent>
                </Card>

                <Card className="border-slate-800 bg-slate-900">
                  <CardHeader><CardTitle>Match recommendations</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm text-slate-300">
                    {recommendations.map((item) => <p key={item}>• {item}</p>)}
                  </CardContent>
                </Card>
              </section>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}