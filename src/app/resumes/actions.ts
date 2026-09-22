"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function downloadResume(formData: FormData) {
  const resumeId = String(formData.get("resumeId") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !resumeId) redirect("/login?next=/resumes");

  const { data: resume } = await supabase
    .from("resumes")
    .select("file_url")
    .eq("id", resumeId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!resume) redirect("/resumes");

  const { data, error } = await supabase.storage
    .from("resumes")
    .createSignedUrl(resume.file_url, 60);

  if (error || !data?.signedUrl) redirect("/resumes");

  redirect(data.signedUrl);
}

export async function deleteResume(formData: FormData) {
  const resumeId = String(formData.get("resumeId") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !resumeId) redirect("/login?next=/resumes");

  const { data: resume } = await supabase
    .from("resumes")
    .select("file_url")
    .eq("id", resumeId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (resume) {
    await supabase.storage.from("resumes").remove([resume.file_url]);
    await supabase
      .from("resumes")
      .delete()
      .eq("id", resumeId)
      .eq("user_id", user.id);
  }

  revalidatePath("/resumes");
  revalidatePath("/dashboard");
  revalidatePath("/analysis");
}
