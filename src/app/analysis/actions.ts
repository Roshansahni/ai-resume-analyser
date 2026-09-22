"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAiResumeFeedback } from "@/lib/ai/resume-feedback";
import { createImprovementRows } from "@/lib/analysis/improvements";
import {
  analyseResume,
  matchResumeToJob,
} from "@/lib/analysis/resume-engine";
import { createClient } from "@/lib/supabase/server";

function analysisUrl(resumeId: string, extra = "") {
  return `/analysis?resume=${resumeId}${extra}`;
}

export async function runAtsAnalysis(formData: FormData) {
  const resumeId = String(formData.get("resumeId") || "");

  if (!resumeId) {
    redirect("/resumes");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/analysis");
  }

  const { data: resume } = await supabase
    .from("resumes")
    .select("id, raw_text")
    .eq("id", resumeId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!resume?.raw_text) {
    redirect(analysisUrl(resumeId, "&error=missing-text"));
  }

  const result = analyseResume(resume.raw_text);

  const { data: analysis, error: analysisError } = await supabase
    .from("analyses")
    .insert({
      user_id: user.id,
      resume_id: resume.id,
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
    })
    .select("id")
    .single();

  if (analysisError || !analysis) {
    console.error("Analysis insert failed:", analysisError);
    redirect(analysisUrl(resumeId, "&error=analysis-failed"));
  }

  const improvements = createImprovementRows({
    userId: user.id,
    resumeId,
    analysisId: analysis.id,
    suggestions: result.suggestions,
    weaknesses: result.weaknesses,
  });

  if (improvements.length > 0) {
    const { error: improvementsError } = await supabase
      .from("improvements")
      .insert(improvements);

    if (improvementsError) {
      console.error("Improvements insert failed:", improvementsError);
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/resumes");
  revalidatePath("/analysis");

  redirect(analysisUrl(resumeId, `&analysis=${analysis.id}`));
}

export async function runJobMatch(formData: FormData) {
  const resumeId = String(formData.get("resumeId") || "");
  const jobId = String(formData.get("jobId") || "");

  if (!resumeId || !jobId) {
    redirect("/analysis");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/analysis");
  }

  const [{ data: resume }, { data: job }] = await Promise.all([
    supabase
      .from("resumes")
      .select("id, raw_text")
      .eq("id", resumeId)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("job_descriptions")
      .select("id, description")
      .eq("id", jobId)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (!resume?.raw_text || !job?.description) {
    redirect(analysisUrl(resumeId, "&error=matching-data"));
  }

  const result = matchResumeToJob(resume.raw_text, job.description);

  const { data: match, error } = await supabase
    .from("job_matches")
    .insert({
      user_id: user.id,
      resume_id: resumeId,
      job_description_id: jobId,
      match_score: result.matchScore,
      matched_skills: result.matchedSkills,
      missing_skills: result.missingSkills,
      partial_skills: result.partialSkills,
      recommendations: result.recommendations,
    })
    .select("id")
    .single();

  if (error || !match) {
    console.error("Job match insert failed:", error);
    redirect(analysisUrl(resumeId, "&error=match-failed"));
  }

  revalidatePath("/dashboard");
  revalidatePath("/analysis");

  redirect(`${analysisUrl(resumeId)}&job=${jobId}&match=${match.id}`);
}

export async function toggleImprovement(formData: FormData) {
  const improvementId = String(formData.get("improvementId") || "");
  const resumeId = String(formData.get("resumeId") || "");
  const status = String(formData.get("status") || "");

  if (
    !improvementId ||
    !resumeId ||
    !["pending", "completed"].includes(status)
  ) {
    redirect("/analysis");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/analysis");
  }

  const { error } = await supabase
    .from("improvements")
    .update({
      status,
      completed_at: status === "completed" ? new Date().toISOString() : null,
    })
    .eq("id", improvementId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Improvement update failed:", error);
  }

  revalidatePath("/dashboard");
  revalidatePath("/analysis");

  redirect(analysisUrl(resumeId));
}

export async function generateAiFeedback(formData: FormData) {
  const resumeId = String(formData.get("resumeId") || "");
  const analysisId = String(formData.get("analysisId") || "");
  const jobId = String(formData.get("jobId") || "");

  if (!resumeId || !analysisId) {
    redirect("/analysis");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/analysis");
  }

  if (!process.env.OPENAI_API_KEY) {
    redirect(analysisUrl(resumeId, `&analysis=${analysisId}&error=ai-not-configured`));
  }

  const [{ data: resume }, { data: analysis }, { data: job }] =
    await Promise.all([
      supabase
        .from("resumes")
        .select("raw_text")
        .eq("id", resumeId)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("analyses")
        .select("id, suggestions, analysis_json")
        .eq("id", analysisId)
        .eq("resume_id", resumeId)
        .eq("user_id", user.id)
        .maybeSingle(),
      jobId
        ? supabase
            .from("job_descriptions")
            .select("description")
            .eq("id", jobId)
            .eq("user_id", user.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  if (!resume?.raw_text || !analysis) {
    redirect(analysisUrl(resumeId, `&analysis=${analysisId}&error=ai-failed`));
  }

  try {
    const feedback = await createAiResumeFeedback({
      rawText: resume.raw_text,
      jobDescription: job?.description,
      deterministicSuggestions: Array.isArray(analysis.suggestions)
        ? analysis.suggestions
        : [],
    });

    const existingJson =
      analysis.analysis_json &&
      typeof analysis.analysis_json === "object" &&
      !Array.isArray(analysis.analysis_json)
        ? analysis.analysis_json
        : {};

    const { error } = await supabase
      .from("analyses")
      .update({
        analysis_json: {
          ...existingJson,
          ai_feedback: feedback,
          ai_feedback_generated_at: new Date().toISOString(),
        },
      })
      .eq("id", analysisId)
      .eq("user_id", user.id);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("AI feedback failed:", error);
    redirect(analysisUrl(resumeId, `&analysis=${analysisId}&error=ai-failed`));
  }

  revalidatePath("/analysis");

  redirect(analysisUrl(resumeId, `&analysis=${analysisId}&ai=done`));
}
