"use server";

import { redirect } from "next/navigation";

import { analyseResume, matchResumeToJob } from "@/lib/analysis/resume-engine";
import { createClient } from "@/lib/supabase/server";

export async function runAtsAnalysis(formData: FormData) {
  const resumeId = String(formData.get("resumeId") ?? "");
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: resume } = await supabase
    .from("resumes")
    .select("raw_text")
    .eq("id", resumeId)
    .maybeSingle();

  if (!user || !resume?.raw_text) redirect("/resumes");

  const result = analyseResume(resume.raw_text);

  await supabase.from("analyses").insert({
    user_id: user.id,
    resume_id: resumeId,
    ats_score: result.atsScore,
    keyword_score: result.keywordScore,
    skill_score: result.skillScore,
    experience_score: result.experienceScore,
    education_score: result.educationScore,
    formatting_score: result.formattingScore,
    project_score: result.projectScore,
    strengths: result.strengths,
    weaknesses: result.weaknesses,
    suggestions: result.suggestions,
    analysis_json: result.analysisJson,
  });

  redirect(`/analysis?resume=${resumeId}`);
}

export async function runJobMatch(formData: FormData) {
  const resumeId = String(formData.get("resumeId") ?? "");
  const jobId = String(formData.get("jobId") ?? "");
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: resume } = await supabase.from("resumes").select("raw_text").eq("id", resumeId).maybeSingle();
  const { data: job } = await supabase.from("job_descriptions").select("description").eq("id", jobId).maybeSingle();

  if (!user || !resume?.raw_text || !job) redirect("/analysis");

  const result = matchResumeToJob(resume.raw_text, job.description);

  await supabase.from("job_matches").insert({
    user_id: user.id,
    resume_id: resumeId,
    job_description_id: jobId,
    match_score: result.matchScore,
    matched_skills: result.matchedSkills,
    missing_skills: result.missingSkills,
    partial_skills: result.partialSkills,
    recommendations: result.recommendations,
  });

  redirect(`/analysis?resume=${resumeId}&job=${jobId}`);
}