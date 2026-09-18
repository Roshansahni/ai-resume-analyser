"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export async function createJobDescription(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!description) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("job_descriptions").insert({
    user_id: user.id,
    title: title || null,
    company: company || null,
    description,
    parsed_requirements: {},
  });

  revalidatePath("/jobs");
  revalidatePath("/analysis");
}

export async function deleteJobDescription(formData: FormData) {
  const jobId = String(formData.get("jobId") ?? "");
  const supabase = await createClient();

  await supabase.from("job_descriptions").delete().eq("id", jobId);

  revalidatePath("/jobs");
  revalidatePath("/analysis");
}