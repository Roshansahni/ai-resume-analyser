import type { Metadata } from "next";
import Link from "next/link";
import { CircleHelp, KeyRound, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicPage } from "@/components/marketing/public-shell";

export const metadata: Metadata = {
  title: "Contact and support",
  description: "Find account recovery, product guidance, and privacy help for AI Resume Analyser.",
};

const supportOptions = [
  {
    title: "Account access",
    description: "Use the secure recovery flow if you cannot sign in or need to choose a new password.",
    href: "/forgot-password",
    action: "Reset password",
    icon: KeyRound,
  },
  {
    title: "Product guidance",
    description: "Review the format, scoring, privacy, and job-matching answers before starting an analysis.",
    href: "/faq",
    action: "Read the FAQ",
    icon: CircleHelp,
  },
  {
    title: "Your data",
    description: "Open your private workspace to review uploaded resumes, analyses, and saved job descriptions.",
    href: "/dashboard",
    action: "Open dashboard",
    icon: ShieldCheck,
  },
];

export default function ContactPage() {
  return (
    <PublicPage>
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-200">Contact and support</p>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">Get the right help, quickly.</h1>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            The most common account, product, and data questions can be resolved securely from within the application.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {supportOptions.map(({ title, description, href, action, icon: Icon }) => (
            <Card key={title} className="flex flex-col border-white/10 bg-slate-900/80">
              <CardHeader>
                <span className="grid size-11 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <CardTitle className="pt-4 text-xl text-white">{title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <p className="leading-7 text-slate-300">{description}</p>
                <Button asChild variant="outline" className="mt-6 w-full border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white">
                  <Link href={href}>{action}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </PublicPage>
  );
}
