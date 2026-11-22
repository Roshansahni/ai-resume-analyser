"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();

  if (!fullName || fullName.length > 120) {
    redirect("/settings?error=Enter+a+name+between+1+and+120+characters.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=%2Fsettings");
  }

  const { error } = await supabase.auth.updateUser({
    data: { full_name: fullName },
  });

  if (error) {
    console.error("Profile update failed", { name: error.name, status: error.status });
    redirect("/settings?error=We+could+not+save+your+profile.+Please+try+again.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings");
  redirect("/settings?status=updated");
}
