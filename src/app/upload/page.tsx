import Link from "next/link";
import { ArrowLeft, FileSearch } from "lucide-react";
import { redirect } from "next/navigation";

import { ResumeUploadForm } from "@/components/resumes/resume-upload-form";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function UploadPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=%2Fupload");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-slate-100">
      <div className="mx-auto max-w-2xl">
        <header className="mb-10 flex items-center justify-between border-b border-slate-800 pb-6">
          <Link className="flex items-center gap-3 font-semibold text-white" href="/dashboard">
            <span className="grid size-10 place-items-center rounded-xl bg-cyan-400 text-slate-950">
              <FileSearch className="size-5" />
            </span>
            AI Resume Analyser
          </Link>

          <Button asChild variant="outline">
            <Link href="/dashboard">
              <ArrowLeft />
              Dashboard
            </Link>
          </Button>
        </header>

        <div className="mb-7">
          <p className="text-sm font-medium text-cyan-300">Private document upload</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
            Add a resume for analysis
          </h1>
          <p className="mt-3 leading-7 text-slate-400">
            Your file is stored in your private Supabase Storage folder. We
            extract text now so the next phase can analyse its ATS quality.
          </p>
        </div>

        <ResumeUploadForm />
      </div>
    </main>
  );
}