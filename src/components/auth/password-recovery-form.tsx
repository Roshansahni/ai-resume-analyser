"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FileSearch, LoaderCircle } from "lucide-react";

import { requestPasswordReset, updatePassword } from "@/app/auth/actions";
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

type Mode = "request" | "reset";

type Feedback = {
  type: "error" | "success";
  title: string;
  description: string;
};

const inputClassName =
  "border-slate-600 bg-slate-950 text-white placeholder:text-slate-400 focus-visible:border-cyan-300 focus-visible:ring-cyan-300/30";

export function PasswordRecoveryForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isRequest = mode === "request";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);

    try {
      if (isRequest) {
        const result = await requestPasswordReset({
          email: String(formData.get("email") ?? ""),
        });

        setFeedback({
          type: result.status === "error" ? "error" : "success",
          title: result.title,
          description: result.description,
        });
        return;
      }

      const password = String(formData.get("password") ?? "");
      const confirmPassword = String(formData.get("confirmPassword") ?? "");

      if (password !== confirmPassword) {
        setFeedback({
          type: "error",
          title: "Passwords do not match",
          description: "Enter the same password in both fields.",
        });
        return;
      }

      const result = await updatePassword({ password });
      setFeedback({
        type: result.status === "error" ? "error" : "success",
        title: result.title,
        description: result.description,
      });

      if (result.status === "success") {
        router.refresh();
        window.setTimeout(() => router.replace("/dashboard"), 850);
      }
    } catch {
      setFeedback({
        type: "error",
        title: "Something went wrong",
        description: "We could not complete the request. Check your connection and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50 sm:px-6">
      <div className="mx-auto w-full max-w-md">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-9 place-items-center rounded-xl bg-cyan-400 text-slate-950">
            <FileSearch className="size-5" aria-hidden="true" />
          </span>
          AI Resume Analyser
        </Link>

        <Card className="border-white/10 bg-slate-900/80 shadow-2xl shadow-cyan-950/20">
          <CardHeader>
            <CardTitle className="text-2xl text-white">
              {isRequest ? "Reset your password" : "Choose a new password"}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {isRequest
                ? "Enter your email and we will send a secure recovery link."
                : "Create a strong password for your AI Resume Analyser account."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              {isRequest ? (
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-100">Email address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    maxLength={254}
                    className={inputClassName}
                    required
                  />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-100">New password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      minLength={8}
                      className={inputClassName}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-slate-100">Confirm new password</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Repeat your new password"
                      minLength={8}
                      className={inputClassName}
                      required
                    />
                  </div>
                </>
              )}

              {feedback ? (
                <Alert variant={feedback.type === "error" ? "destructive" : "default"} aria-live="polite">
                  <AlertTitle>{feedback.title}</AlertTitle>
                  <AlertDescription>{feedback.description}</AlertDescription>
                </Alert>
              ) : null}

              <Button type="submit" className="w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300" disabled={isLoading}>
                {isLoading ? (
                  <><LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> Please wait</>
                ) : (
                  <>{isRequest ? "Send recovery link" : "Update password"}<ArrowRight className="size-4" aria-hidden="true" /></>
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              Remembered your password?{" "}
              <Link href="/login" className="font-medium text-cyan-300 hover:text-cyan-200">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
