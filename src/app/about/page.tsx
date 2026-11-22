import type { Metadata } from "next";
import { BrainCircuit, LockKeyhole, ScanSearch } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicPage } from "@/components/marketing/public-shell";

export const metadata: Metadata = {
  title: "About",
  description: "Learn how AI Resume Analyser turns resume text into practical, explainable career guidance.",
};

const principles = [
  {
    title: "Explainable guidance",
    description: "Scores are built from visible resume signals, so you can understand what to improve and why.",
    icon: ScanSearch,
  },
  {
    title: "AI where it adds value",
    description: "Structured AI feedback turns the analysis into clear, fact-preserving improvements instead of vague advice.",
    icon: BrainCircuit,
  },
  {
    title: "Private by design",
    description: "Authentication, user-scoped records, and private storage keep your documents and reports isolated to your account.",
    icon: LockKeyhole,
  },
];

export default function AboutPage() {
  return (
    <PublicPage>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16),transparent_42%)]" />
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <Badge className="border border-cyan-300/20 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/10">
            About the platform
          </Badge>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            Resume feedback that is practical, structured, and easy to act on.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            AI Resume Analyser helps job seekers understand how their resume is read by ATS-style systems,
            where it matches a role, and which changes will have the greatest impact.
          </p>
        </div>
      </section>

      <section className="border-y border-white/10 bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {principles.map(({ title, description, icon: Icon }) => (
              <Card key={title} className="border-white/10 bg-slate-950/70">
                <CardHeader>
                  <span className="grid size-11 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <CardTitle className="pt-4 text-xl text-white">{title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-6 text-slate-300">{description}</CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">How an analysis is produced</h2>
          <p className="mt-4 leading-7 text-slate-300">
            A document is validated, text is safely extracted, and the existing resume engine identifies
            sections, skills, keywords, experience signals, and formatting indicators. The system then
            creates an ATS-style report that you can compare with saved job descriptions.
          </p>
        </div>
        <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/5 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-200">Built for progress</p>
          <p className="mt-4 text-xl font-semibold text-white">Upload → analyse → compare → improve</p>
          <p className="mt-3 leading-7 text-slate-300">
            Keep a history of reports, add target roles, and use focused suggestions to iterate with confidence.
          </p>
        </div>
      </section>
    </PublicPage>
  );
}
