import Link from "next/link";
import { FileSearch, LogOut, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

import { signOut } from "./actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const displayName =
    user.user_metadata.full_name || user.email?.split("@")[0] || "there";

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid size-9 place-items-center rounded-xl bg-cyan-400 text-slate-950">
              <FileSearch className="size-5" aria-hidden="true" />
            </span>
            AI Resume Analyser
          </Link>

          <form action={signOut}>
            <Button
              type="submit"
              variant="outline"
              className="border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Logout
            </Button>
          </form>
        </header>

        <section className="py-12">
          <Badge className="border border-cyan-300/20 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/10">
            Secure session active
          </Badge>

          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
            Welcome, {displayName}.
          </h1>

          <p className="mt-3 max-w-2xl text-slate-300">
            Your account is authenticated securely through Supabase Auth. Resume
            analyses, uploaded documents, and future reports will be scoped to this account.
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <Card className="border-white/10 bg-slate-900/80">
              <CardHeader>
                <span className="mb-2 grid size-11 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200">
                  <ShieldCheck className="size-5" aria-hidden="true" />
                </span>
                <CardTitle className="text-white">Account verified</CardTitle>
                <CardDescription className="text-slate-400">
                  This protected page is accessible only when a valid user session exists.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-white/10 bg-slate-900/80">
              <CardHeader>
                <CardTitle className="text-white">Signed-in account</CardTitle>
                <CardDescription className="text-slate-400">
                  {user.email}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-slate-300">
                Account created:{" "}
                {new Date(user.created_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}