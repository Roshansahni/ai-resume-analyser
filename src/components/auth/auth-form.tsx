"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FileSearch, LoaderCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthMode;
};

type Feedback = {
  type: "error" | "success";
  title: string;
  description: string;
};

const inputClassName =
  "border-slate-600 bg-slate-950 text-white placeholder:text-slate-400 focus-visible:border-cyan-300 focus-visible:ring-cyan-300/30";

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isSignup = mode === "signup";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const fullName = String(formData.get("fullName") ?? "").trim();
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (isSignup && password !== confirmPassword) {
      setFeedback({
        type: "error",
        title: "Passwords do not match",
        description: "Enter the same password in both password fields.",
      });
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/confirm`,
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) {
          setFeedback({
            type: "error",
            title: "Unable to create your account",
            description: error.message,
          });
          return;
        }

        if (data.session) {
          router.push("/dashboard");
          router.refresh();
          return;
        }

        setFeedback({
          type: "success",
          title: "Check your email",
          description:
            "We sent a confirmation link to your email address. Open it to activate your account.",
        });
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setFeedback({
          type: "error",
          title: "Unable to sign in",
          description: "Check your email and password, then try again.",
        });
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setFeedback({
        type: "error",
        title: "Something went wrong",
        description:
          "We could not complete the request. Check your connection and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50 sm:px-6">
      <div className="mx-auto w-full max-w-md">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 font-semibold tracking-tight"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-cyan-400 text-slate-950">
            <FileSearch className="size-5" aria-hidden="true" />
          </span>
          AI Resume Analyser
        </Link>

        <Card className="border-white/10 bg-slate-900/80 shadow-2xl shadow-cyan-950/20">
          <CardHeader>
            <CardTitle className="text-2xl text-white">
              {isSignup ? "Create your account" : "Welcome back"}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {isSignup
                ? "Start analysing resumes and matching them to job requirements."
                : "Sign in to access your private resume analysis workspace."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              {isSignup ? (
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-slate-100">
                    Full name
                  </Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    placeholder="Your full name"
                    autoComplete="name"
                    className={inputClassName}
                    required
                  />
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-100">
                  Email address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={inputClassName}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-100">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="At least 8 characters"
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  minLength={8}
                  className={inputClassName}
                  required
                />
              </div>

              {isSignup ? (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-slate-100">
                    Confirm password
                  </Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    minLength={8}
                    className={inputClassName}
                    required
                  />
                </div>
              ) : null}

              {feedback ? (
                <Alert
                  variant={feedback.type === "error" ? "destructive" : "default"}
                  aria-live="polite"
                >
                  <AlertTitle>{feedback.title}</AlertTitle>
                  <AlertDescription>{feedback.description}</AlertDescription>
                </Alert>
              ) : null}

              <Button
                type="submit"
                className="w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                    Please wait
                  </>
                ) : (
                  <>
                    {isSignup ? "Create account" : "Sign in"}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </>
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              {isSignup ? "Already have an account?" : "New to AI Resume Analyser?"}{" "}
              <Link
                href={isSignup ? "/login" : "/signup"}
                className="font-medium text-cyan-300 hover:text-cyan-200"
              >
                {isSignup ? "Sign in" : "Create an account"}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}