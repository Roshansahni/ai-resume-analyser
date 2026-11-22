"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

const MAX_JOB_TITLE_LENGTH = 120;
const MAX_COMPANY_LENGTH = 120;
const MAX_JOB_DESCRIPTION_LENGTH = 20_000;

function jobsUrl(query: string) {
  return `/jobs?${query}`;
}

export async function createJobDescription(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!description) {
    redirect(jobsUrl("error=description-required"));
  }

  if (description.length > MAX_JOB_DESCRIPTION_LENGTH) {
    redirect(jobsUrl("error=description-too-long"));
  }

  if (title.length > MAX_JOB_TITLE_LENGTH || company.length > MAX_COMPANY_LENGTH) {
    redirect(jobsUrl("error=field-too-long"));
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/jobs");

  const { error } = await supabase.from("job_descriptions").insert({
    user_id: user.id,
    title: title || null,
    company: company || null,
    description,
    parsed_requirements: {},
  });

  if (error) {
    console.error("Job description insert failed", { code: error.code });
    redirect(jobsUrl("error=save-failed"));
  }

  revalidatePath("/jobs");
  revalidatePath("/analysis");
  revalidatePath("/dashboard");
  redirect(jobsUrl("status=saved"));
}

export async function deleteJobDescription(formData: FormData) {
  const jobId = String(formData.get("jobId") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/jobs");
  if (!jobId) redirect(jobsUrl("error=job-required"));

  const { error } = await supabase
    .from("job_descriptions")
    .delete()
    .eq("id", jobId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Job description delete failed", { code: error.code });
    redirect(jobsUrl("error=delete-failed"));
  }

  revalidatePath("/jobs");
  revalidatePath("/analysis");
  revalidatePath("/dashboard");
  redirect(jobsUrl("status=deleted"));
}
