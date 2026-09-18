import Link from "next/link";
import { Download, FileText, Trash2, Upload } from "lucide-react";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

import { deleteResume, downloadResume } from "./actions";

export default async function ResumesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: resumes = [] } = await supabase
    .from("resumes")
    .select("id, file_name, file_type, file_size_bytes, processing_status, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-cyan-300">Private document library</p>
            <h1 className="mt-1 text-3xl font-bold">Your resumes</h1>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button asChild className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
              <Link href="/upload"><Upload /> Upload resume</Link>
            </Button>
          </div>
        </header>

        <div className="space-y-4">
          {resumes.map((resume) => (
            <Card className="border-slate-800 bg-slate-900" key={resume.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="text-cyan-300" />
                  <div>
                    <CardTitle>{resume.file_name}</CardTitle>
                    <p className="mt-1 text-sm text-slate-400">
                      {new Date(resume.created_at).toLocaleDateString("en-IN")} ·{" "}
                      {(resume.file_size_bytes / 1024 / 1024).toFixed(2)} MB ·{" "}
                      {resume.processing_status}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <form action={downloadResume}>
                    <input name="resumeId" type="hidden" value={resume.id} />
                    <Button size="icon" type="submit" variant="outline">
                      <Download />
                    </Button>
                  </form>
                  <form action={deleteResume}>
                    <input name="resumeId" type="hidden" value={resume.id} />
                    <Button size="icon" type="submit" variant="destructive">
                      <Trash2 />
                    </Button>
                  </form>
                  <Button asChild>
                    <Link href={`/analysis?resume=${resume.id}`}>Analyse</Link>
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}

          {resumes.length === 0 ? (
            <Card className="border-slate-800 bg-slate-900">
              <CardContent className="py-12 text-center text-slate-400">
                No resumes uploaded yet.
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </main>
  );
}