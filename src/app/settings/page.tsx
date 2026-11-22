import Link from "next/link";
import { ArrowLeft, CalendarDays, Mail, ShieldCheck, UserRound } from "lucide-react";
import { redirect } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/server";

import { updateProfile } from "./actions";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; error?: string }>;
}) {
  const [{ status, error }, supabase] = await Promise.all([searchParams, createClient()]);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=%2Fsettings");

  const fullName = user.user_metadata.full_name?.trim() || user.email?.split("@")[0] || "";

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-cyan-200 hover:text-cyan-100">
            <ArrowLeft className="size-4" aria-hidden="true" /> Dashboard
          </Link>
          <Badge className="border border-cyan-300/20 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/10">Account settings</Badge>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Profile settings</h1>
          <p className="mt-3 leading-7 text-slate-300">Keep the identity shown across your private resume workspace up to date.</p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-white/10 bg-slate-900/80">
            <CardHeader>
              <CardTitle className="text-xl text-white">Personal profile</CardTitle>
              <CardDescription className="text-slate-400">Your email is managed by your authentication account.</CardDescription>
            </CardHeader>
            <CardContent>
              {status === "updated" ? (
                <Alert className="mb-5 border-emerald-300/20 bg-emerald-300/10 text-emerald-100">
                  <AlertTitle>Profile updated</AlertTitle>
                  <AlertDescription>Your display name has been saved.</AlertDescription>
                </Alert>
              ) : null}
              {error ? (
                <Alert variant="destructive" className="mb-5"><AlertTitle>Unable to update profile</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
              ) : null}

              <form action={updateProfile} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-slate-100">Display name</Label>
                  <Input id="fullName" name="fullName" defaultValue={fullName} maxLength={120} required className="border-slate-600 bg-slate-950 text-white focus-visible:border-cyan-300 focus-visible:ring-cyan-300/30" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-100">Email address</Label>
                  <Input id="email" value={user.email ?? ""} disabled className="border-slate-700 bg-slate-950/70 text-slate-400" />
                </div>
                <Button type="submit" className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">Save profile</Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-white/10 bg-slate-900/80">
              <CardHeader>
                <span className="grid size-10 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200"><UserRound className="size-5" aria-hidden="true" /></span>
                <CardTitle className="pt-3 text-lg text-white">Account summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-300">
                <p className="flex gap-3"><Mail className="mt-0.5 size-4 shrink-0 text-cyan-300" aria-hidden="true" /><span>{user.email}</span></p>
                <p className="flex gap-3"><CalendarDays className="mt-0.5 size-4 shrink-0 text-cyan-300" aria-hidden="true" /><span>Member since {formatDate(user.created_at)}</span></p>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-slate-900/80">
              <CardHeader>
                <span className="grid size-10 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200"><ShieldCheck className="size-5" aria-hidden="true" /></span>
                <CardTitle className="pt-3 text-lg text-white">Security</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-slate-300">Use a unique password. If you need to change it, use the secure password recovery flow.</p>
                <Button asChild variant="outline" className="mt-4 border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"><Link href="/forgot-password">Reset password</Link></Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
