import Link from "next/link";
import { Building2, Plus, Trash2 } from "lucide-react";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/server";

import { createJobDescription, deleteJobDescription } from "./actions";

export default async function JobsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: jobs = [] } = await supabase
    .from("job_descriptions")
    .select("id, title, company, description, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-cyan-300">Target roles</p>
            <h1 className="mt-1 text-3xl font-bold">Job descriptions</h1>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </header>

        <Card className="border-slate-800 bg-slate-900">
          <CardHeader><CardTitle>Add a job description</CardTitle></CardHeader>
          <CardContent>
            <form action={createJobDescription} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input className="bg-slate-950 text-white" name="title" placeholder="Job title" />
                <Input className="bg-slate-950 text-white" name="company" placeholder="Company" />
              </div>
              <Textarea
                className="min-h-48 bg-slate-950 text-white"
                name="description"
                placeholder="Paste the complete job description here..."
                required
              />
              <Button className="bg-cyan-400 text-slate-950 hover:bg-cyan-300" type="submit">
                <Plus /> Save job description
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 space-y-4">
          {jobs.map((job) => (
            <Card className="border-slate-800 bg-slate-900" key={job.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>{job.title || "Untitled role"}</CardTitle>
                  <p className="mt-1 flex items-center gap-2 text-sm text-slate-400">
                    <Building2 className="size-4" /> {job.company || "Company not specified"}
                  </p>
                </div>
                <form action={deleteJobDescription}>
                  <input name="jobId" type="hidden" value={job.id} />
                  <Button size="icon" type="submit" variant="destructive">
                    <Trash2 />
                  </Button>
                </form>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3 whitespace-pre-wrap text-sm text-slate-300">
                  {job.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}