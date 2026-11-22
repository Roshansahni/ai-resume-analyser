import Link from "next/link";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  Clock3,
  FileText,
  Sparkles,
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

import {
  generateAiFeedback,
  toggleImprovement,
} from "./actions";
import { AnalysisControls } from "./analysis-controls";

function toStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function errorMessage(code?: string) {
  const messages: Record<string, string> = {
    "missing-text": "This resume has no extracted text. Upload a readable file in a supported format.",
    "analysis-failed": "The analysis could not be saved. Please try again.",
    "matching-data": "Choose a resume with extracted text and a saved job description.",
    "match-failed": "The job match could not be saved. Please try again.",
    "ai-not-configured": "AI feedback is not configured for this environment. Ask the project owner to add the required server-side API key.",
    "ai-failed": "AI feedback could not be generated. Check your API key, billing, and network connection.",
  };

  return code ? messages[code] : undefined;
}

export default async function AnalysisPage({
  searchParams,
}: {
  searchParams: Promise<{
    resume?: string;
    job?: string;
    analysis?: string;
    match?: string;
    error?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/analysis");
  }

  const [resumesResult, jobsResult] = await Promise.all([
    supabase
      .from("resumes")
      .select("id, file_name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("job_descriptions")
      .select("id, title, company")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const resumes = resumesResult.data ?? [];
  const jobs = jobsResult.data ?? [];
  const selectedResume =
    resumes.find((resume) => resume.id === params.resume) ?? resumes[0];
  const selectedJob = jobs.find((job) => job.id === params.job) ?? jobs[0];
  const resumeId = selectedResume?.id ?? "";
  const jobId = selectedJob?.id;

  const [
    selectedAnalysisResult,
    latestAnalysisResult,
    selectedMatchResult,
    latestMatchResult,
    historyResult,
    improvementsResult,
  ] =
    await Promise.all([
      resumeId && params.analysis
        ? supabase
            .from("analyses")
            .select("*")
            .eq("id", params.analysis)
            .eq("resume_id", resumeId)
            .eq("user_id", user.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      resumeId
        ? supabase
            .from("analyses")
            .select("*")
            .eq("resume_id", resumeId)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      resumeId && jobId && params.match
        ? supabase
            .from("job_matches")
            .select("*")
            .eq("id", params.match)
            .eq("resume_id", resumeId)
            .eq("job_description_id", jobId)
            .eq("user_id", user.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      resumeId && jobId
        ? supabase
            .from("job_matches")
            .select("*")
            .eq("resume_id", resumeId)
            .eq("job_description_id", jobId)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      resumeId
        ? supabase
            .from("analyses")
            .select("id, ats_score, created_at")
            .eq("resume_id", resumeId)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(8)
        : Promise.resolve({ data: [] }),
      resumeId
        ? supabase
            .from("improvements")
            .select("id, section, improved_text, status, created_at")
            .eq("resume_id", resumeId)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(12)
        : Promise.resolve({ data: [] }),
    ]);

  // Invalid or stale URL parameters must not leave the user with a blank page.
  // Fall back to the current resume/job's latest saved report instead.
  const analysis = selectedAnalysisResult.data ?? latestAnalysisResult.data;
  const match = selectedMatchResult.data ?? latestMatchResult.data;
  const history = historyResult.data ?? [];
  const improvements = improvementsResult.data ?? [];
  const strengths = toStringArray(analysis?.strengths);
  const weaknesses = toStringArray(analysis?.weaknesses);
  const suggestions = toStringArray(analysis?.suggestions);
  const matchedSkills = toStringArray(match?.matched_skills);
  const missingSkills = toStringArray(match?.missing_skills);
  const partialSkills = toStringArray(match?.partial_skills);
  const recommendations = toStringArray(match?.recommendations);
  const analysisJson =
    analysis?.analysis_json &&
    typeof analysis.analysis_json === "object" &&
    !Array.isArray(analysis.analysis_json)
      ? analysis.analysis_json
      : {};
  const aiFeedback =
    typeof analysisJson.ai_feedback === "string"
      ? analysisJson.ai_feedback
      : null;
  const alert = errorMessage(params.error);

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-cyan-300 hover:text-cyan-200">
              <ArrowLeft className="size-4" /> Dashboard
            </Link>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">Resume analysis</h1>
            <p className="mt-2 text-slate-400">Run ATS scoring, compare roles, and track practical improvements.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white">
              <Link href="/resumes"><FileText /> Resumes</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white">
              <Link href="/jobs"><BriefcaseBusiness /> Jobs</Link>
            </Button>
          </div>
        </header>

        {alert ? (
          <div className="mb-6 flex gap-3 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
            <CircleAlert className="mt-0.5 size-5 shrink-0 text-red-300" />
            <p>{alert}</p>
          </div>
        ) : null}

        {resumes.length === 0 ? (
          <Card className="border-white/10 bg-slate-900/80">
            <CardContent className="py-14 text-center">
              <FileText className="mx-auto size-10 text-cyan-300" />
              <h2 className="mt-4 text-xl font-semibold">Upload a resume first</h2>
              <p className="mx-auto mt-2 max-w-md text-slate-400">Your resume must have extracted text before ATS scoring and job matching can begin.</p>
              <Button asChild className="mt-6 bg-cyan-400 text-slate-950 hover:bg-cyan-300"><Link href="/upload">Upload resume</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <AnalysisControls
              hasAnalysis={Boolean(analysis)}
              jobId={jobId}
              jobs={jobs}
              resumeId={resumeId}
              resumes={resumes}
            />

            {analysis ? (
              <>
                <section className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
                  <Card className="border-cyan-300/30 bg-slate-900/80">
                    <CardHeader><p className="text-sm text-slate-400">Overall ATS score</p><CardTitle className="text-5xl text-cyan-300">{analysis.ats_score}/100</CardTitle><CardDescription className="text-slate-400">Generated {formatDate(analysis.created_at)}</CardDescription></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-3 text-sm text-slate-300"><span>Keywords: {analysis.keyword_score}</span><span>Skills: {analysis.skill_score}</span><span>Experience: {analysis.experience_score}</span><span>Education: {analysis.education_score}</span><span>Formatting: {analysis.formatting_score}</span><span>Projects: {analysis.project_score}</span></CardContent>
                  </Card>
                  <Card className="border-white/10 bg-slate-900/80">
                    <CardHeader><CardTitle>Analysis history</CardTitle><CardDescription className="text-slate-400">Select an earlier ATS report for this resume.</CardDescription></CardHeader>
                    <CardContent>
                      {history.length === 0 ? <p className="text-sm text-slate-400">No saved analyses yet.</p> : <div className="space-y-2">{history.map((entry) => <Link key={entry.id} href={`/analysis?resume=${resumeId}&analysis=${entry.id}`} className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${entry.id === analysis.id ? "border-cyan-300/50 bg-cyan-300/10" : "border-white/10 hover:bg-white/5"}`}><span className="flex items-center gap-2 text-slate-300"><Clock3 className="size-4 text-cyan-300" /> {formatDate(entry.created_at)}</span><strong className="text-cyan-200">{entry.ats_score}/100</strong></Link>)}</div>}
                    </CardContent>
                  </Card>
                </section>

                <section className="grid gap-5 lg:grid-cols-3">
                  <Card className="border-white/10 bg-slate-900/80"><CardHeader><CardTitle>Strengths</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-emerald-100">{strengths.length ? strengths.map((item) => <p key={item}><CheckCircle2 className="mr-2 inline size-4 text-emerald-300" />{item}</p>) : <p className="text-slate-400">No strengths were generated.</p>}</CardContent></Card>
                  <Card className="border-white/10 bg-slate-900/80"><CardHeader><CardTitle>Areas to improve</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-amber-100">{weaknesses.length ? weaknesses.map((item) => <p key={item}>• {item}</p>) : <p className="text-slate-400">No concerns were generated.</p>}</CardContent></Card>
                  <Card className="border-white/10 bg-slate-900/80"><CardHeader><CardTitle>Suggestions</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-slate-300">{suggestions.length ? suggestions.map((item) => <p key={item}>• {item}</p>) : <p className="text-slate-400">No suggestions were generated.</p>}</CardContent></Card>
                </section>

                <section className="grid gap-5 lg:grid-cols-2">
                  <Card className="border-white/10 bg-slate-900/80">
                    <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardCheck className="size-5 text-cyan-300" /> Improvement tracker</CardTitle><CardDescription className="text-slate-400">Mark suggestions complete as you update your resume.</CardDescription></CardHeader>
                    <CardContent className="space-y-3">
                      {improvements.length ? improvements.map((improvement) => {
                        const complete = improvement.status === "completed";
                        return <div key={improvement.id} className="flex gap-3 rounded-lg border border-white/10 p-3"><CheckCircle2 className={`mt-0.5 size-5 shrink-0 ${complete ? "text-emerald-300" : "text-slate-600"}`} /><div className="min-w-0 flex-1"><Badge variant="outline" className="border-cyan-300/20 text-cyan-200">{improvement.section}</Badge><p className={`mt-2 text-sm ${complete ? "text-slate-500 line-through" : "text-slate-200"}`}>{improvement.improved_text}</p></div><form action={toggleImprovement}><input name="improvementId" type="hidden" value={improvement.id} /><input name="resumeId" type="hidden" value={resumeId} /><input name="status" type="hidden" value={complete ? "pending" : "completed"} /><Button size="sm" type="submit" variant="outline" className="border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white">{complete ? "Reopen" : "Complete"}</Button></form></div>;
                      }) : <p className="text-sm text-slate-400">Run an ATS analysis to create an improvement checklist.</p>}
                    </CardContent>
                  </Card>
                  <Card className="border-cyan-300/20 bg-slate-900/80">
                    <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="size-5 text-cyan-300" /> Optional AI feedback</CardTitle><CardDescription className="text-slate-400">Generate coaching from your selected resume and optional job description.</CardDescription></CardHeader>
                    <CardContent>
                      {aiFeedback ? <div className="whitespace-pre-wrap text-sm leading-7 text-slate-200">{aiFeedback}</div> : <><p className="text-sm leading-6 text-slate-400">Only continue if you consent to sending the selected resume text and optional job description to OpenAI for feedback.</p><form action={generateAiFeedback} className="mt-4"><input name="resumeId" type="hidden" value={resumeId} /><input name="analysisId" type="hidden" value={analysis.id} />{jobId ? <input name="jobId" type="hidden" value={jobId} /> : null}<Button className="bg-cyan-400 text-slate-950 hover:bg-cyan-300" type="submit"><Sparkles /> Generate AI feedback</Button></form></>}
                    </CardContent>
                  </Card>
                </section>
              </>
            ) : null}

            {match ? (
              <section className="grid gap-5 lg:grid-cols-2">
                <Card className="border-cyan-300/30 bg-slate-900/80"><CardHeader><p className="text-sm text-slate-400">Job-match score</p><CardTitle className="text-5xl text-cyan-300">{match.match_score}%</CardTitle></CardHeader><CardContent className="space-y-4"><div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Matched skills</p><div className="flex flex-wrap gap-2">{matchedSkills.length ? matchedSkills.map((skill) => <Badge key={skill} className="bg-emerald-400/15 text-emerald-200">{skill}</Badge>) : <span className="text-sm text-slate-400">None detected</span>}</div></div><div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Missing skills</p><div className="flex flex-wrap gap-2">{missingSkills.length ? missingSkills.map((skill) => <Badge key={skill} className="bg-red-400/15 text-red-200">{skill}</Badge>) : <span className="text-sm text-slate-400">None detected</span>}</div></div>{partialSkills.length ? <div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Partial matches</p><div className="flex flex-wrap gap-2">{partialSkills.map((skill) => <Badge key={skill} className="bg-amber-400/15 text-amber-200">{skill}</Badge>)}</div></div> : null}</CardContent></Card>
                <Card className="border-white/10 bg-slate-900/80"><CardHeader><CardTitle>Match recommendations</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-slate-300">{recommendations.length ? recommendations.map((item) => <p key={item}>• {item}</p>) : <p className="text-slate-400">No recommendations were generated.</p>}</CardContent></Card>
              </section>
            ) : null}
          </div>
        )}
      </div>
    </main>
  );
}
