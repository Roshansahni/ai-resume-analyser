import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  FileSearch,
  LockKeyhole,
  ScanSearch,
  Sparkles,
  Target,
  UploadCloud,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    title: "ATS-style scoring",
    description:
      "Understand resume structure, keyword coverage, skills, projects, and contact completeness through transparent category scores.",
    icon: BarChart3,
  },
  {
    title: "Job matching",
    description:
      "Compare a resume against a job description to identify matched keywords, missing skills, and job relevance.",
    icon: Target,
  },
  {
    title: "Skill-gap analysis",
    description:
      "See which high-priority technical skills to learn or add before applying for a specific role.",
    icon: ScanSearch,
  },
  {
    title: "AI recommendations",
    description:
      "Receive structured, fact-preserving suggestions to improve clarity, bullet points, and resume presentation.",
    icon: BrainCircuit,
  },
  {
    title: "Multiple document formats",
    description:
      "Upload supported resume formats securely for text extraction, section detection, and structured analysis.",
    icon: UploadCloud,
  },
  {
    title: "Private by design",
    description:
      "Your resume records and analysis history will be protected through authenticated, user-scoped access.",
    icon: LockKeyhole,
  },
];

const steps = [
  {
    number: "01",
    title: "Upload your resume",
    description: "Upload a PDF, Word document, text, RTF, HTML, or ODT resume, then let the application extract and structure its content.",
  },
  {
    number: "02",
    title: "Add a job description",
    description: "Paste a target role’s job description to analyse requirements and expected skills.",
  },
  {
    number: "03",
    title: "Review your report",
    description: "Understand your ATS-style score, skill gaps, strengths, and practical next actions.",
  },
];

const scoreItems = [
  { label: "Resume structure", value: "92%" },
  { label: "Skills coverage", value: "86%" },
  { label: "Keyword relevance", value: "78%" },
  { label: "Project quality", value: "84%" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid size-9 place-items-center rounded-xl bg-cyan-400 text-slate-950">
              <FileSearch className="size-5" aria-hidden="true" />
            </span>
            <span>AI Resume Analyser</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
            <a href="#how-it-works" className="transition hover:text-white">
              How it works
            </a>
            <a href="#privacy" className="transition hover:text-white">
              Privacy
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden text-slate-200 hover:bg-white/10 hover:text-white sm:inline-flex">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
              <Link href="/signup">
                Get started
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[520px] w-[780px] -translate-x-1/2 rounded-full bg-cyan-400/15 blur-3xl" />
          <div className="absolute right-0 top-40 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />
        </div>

        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8">
          <div>
            <Badge className="border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-cyan-200 hover:bg-cyan-300/10">
              AI-powered resume intelligence
            </Badge>

            <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Analyze your resume.{" "}
              <span className="text-cyan-300">Understand your ATS compatibility.</span>{" "}
              Match real job requirements.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              AI Resume Analyser combines rule-based scoring with structured AI analysis
              to help students and job seekers improve their resumes with confidence.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
                <Link href="/signup">
                  Analyze my resume
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                <a href="#how-it-works">See how it works</a>
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm text-slate-300">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-cyan-300" aria-hidden="true" />
                PDF, Word, text, RTF, HTML, and ODT support
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-cyan-300" aria-hidden="true" />
                Structured AI feedback
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-cyan-300" aria-hidden="true" />
                Secure user accounts
              </span>
            </div>
          </div>

          <Card className="border-white/10 bg-slate-900/80 shadow-2xl shadow-cyan-950/30">
            <CardHeader className="border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl text-white">Resume health report</CardTitle>
                  <CardDescription className="mt-1 text-slate-400">
                    Example application-generated analysis
                  </CardDescription>
                </div>
                <div className="grid size-12 place-items-center rounded-full border-4 border-cyan-300 bg-cyan-300/10 text-sm font-bold text-cyan-200">
                  84
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-400">ATS score</p>
                  <p className="mt-2 text-3xl font-bold text-white">82<span className="text-base text-slate-400">/100</span></p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-400">Job match</p>
                  <p className="mt-2 text-3xl font-bold text-white">74<span className="text-base text-slate-400">%</span></p>
                </div>
              </div>

              <div className="space-y-4">
                {scoreItems.map((item) => (
                  <div key={item.label}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-slate-300">{item.label}</span>
                      <span className="font-medium text-cyan-200">{item.value}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                        style={{ width: item.value }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-cyan-300/15 bg-cyan-300/5 p-4">
                <p className="flex items-center gap-2 font-medium text-cyan-100">
                  <Sparkles className="size-4 text-cyan-300" aria-hidden="true" />
                  Next best action
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Add measurable outcomes to project bullets and include missing role-specific keywords.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="features" className="border-y border-white/10 bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <Badge variant="outline" className="border-cyan-300/30 text-cyan-200">
              Complete analysis workflow
            </Badge>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Everything needed to improve before applying
            </h2>
            <p className="mt-4 text-slate-300">
              Built as a hybrid AI and deterministic analysis system—not simply a PDF-to-AI chatbot.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <Card key={feature.title} className="border-white/10 bg-slate-950/60 transition hover:-translate-y-1 hover:border-cyan-300/30">
                  <CardHeader>
                    <span className="grid size-11 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <CardTitle className="pt-4 text-lg text-white">{feature.title}</CardTitle>
                    <CardDescription className="leading-6 text-slate-400">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div>
            <Badge variant="outline" className="border-violet-300/30 text-violet-200">
              Simple workflow
            </Badge>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              From resume upload to actionable improvement plan
            </h2>
            <p className="mt-4 max-w-xl text-slate-300">
              The application separates text extraction, structured parsing, rule-based scoring,
              job matching, and AI recommendations so each result is explainable.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-semibold text-cyan-300">{step.number}</p>
                <h3 className="mt-5 text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="privacy" className="border-y border-white/10 bg-cyan-300/5">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-cyan-300 text-slate-950">
                <LockKeyhole className="size-5" aria-hidden="true" />
              </span>
              <h2 className="text-2xl font-bold">Your data deserves protection.</h2>
            </div>
            <p className="mt-4 max-w-3xl text-slate-300">
              The production application will use authenticated access, PostgreSQL Row Level Security,
              and user-scoped file storage so users can access only their own resumes and reports.
            </p>
          </div>

          <Button asChild variant="outline" className="border-cyan-200/30 bg-transparent text-cyan-100 hover:bg-cyan-200/10 hover:text-white">
            <a href="#features">Explore features</a>
          </Button>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>© 2026 AI Resume Analyser. Built for academic and professional use.</p>
        <p>B.Tech AI & Data Science Final-Year Project</p>
      </footer>
    </main>
  );
}
