"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function resumesUrl(query: string) {
  return `/resumes?${query}`;
}

export async function downloadResume(formData: FormData) {
  const resumeId = String(formData.get("resumeId") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/resumes");
  if (!resumeId) redirect(resumesUrl("error=resume-required"));

  const { data: resume } = await supabase
    .from("resumes")
    .select("file_url")
    .eq("id", resumeId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!resume) redirect(resumesUrl("error=resume-not-found"));

  const { data, error } = await supabase.storage
    .from("resumes")
    .createSignedUrl(resume.file_url, 60);

  if (error || !data?.signedUrl) {
    console.error("Resume download URL creation failed", { code: error?.name });
    redirect(resumesUrl("error=download-failed"));
  }

  redirect(data.signedUrl);
}

export async function deleteResume(formData: FormData) {
  const resumeId = String(formData.get("resumeId") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/resumes");
  if (!resumeId) redirect(resumesUrl("error=resume-required"));

  const { data: resume } = await supabase
    .from("resumes")
    .select("file_url")
    .eq("id", resumeId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!resume) {
    redirect(resumesUrl("error=resume-not-found"));
  }

  const { error: databaseError } = await supabase
    .from("resumes")
    .delete()
    .eq("id", resumeId)
    .eq("user_id", user.id);

  if (databaseError) {
    console.error("Resume record delete failed", { code: databaseError.code });
    redirect(resumesUrl("error=delete-failed"));
  }

  const { error: storageError } = await supabase.storage
    .from("resumes")
    .remove([resume.file_url]);

  revalidatePath("/resumes");
  revalidatePath("/dashboard");
  revalidatePath("/analysis");
  redirect(resumesUrl(storageError ? "status=deleted-with-warning" : "status=deleted"));
}
