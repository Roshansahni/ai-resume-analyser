import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { PublicPage } from "@/components/marketing/public-shell";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description: "Answers to common AI Resume Analyser questions about documents, privacy, scoring, and accounts.",
};

const questions = [
  {
    question: "Which resume formats can I upload?",
    answer: "The upload workflow supports PDF, DOC, DOCX, TXT, Markdown, RTF, HTML, HTM, and ODT. Text is extracted from the original document; files are never renamed or treated as a different format.",
  },
  {
    question: "What happens with a scanned PDF?",
    answer: "A scanned PDF contains images rather than selectable text. The application detects this and explains that OCR is needed, rather than producing misleading analysis from an empty document.",
  },
  {
    question: "How is the ATS-style score calculated?",
    answer: "The report evaluates visible resume signals such as section coverage, technical or professional skills, keyword presence, experience, education, projects, and formatting. It is guidance, not a guarantee of an employer's ATS result.",
  },
  {
    question: "Can I compare more than one resume?",
    answer: "Yes. Each uploaded document is kept in your private resume library. Select a resume from the analysis page to view its report or produce an updated analysis.",
  },
  {
    question: "Who can access my resume?",
    answer: "Your records are stored behind authenticated, user-scoped database and storage policies. The application queries your account's records only after you sign in.",
  },
  {
    question: "I forgot my password. What should I do?",
    answer: "Use the password-recovery page from the sign-in screen. The service sends a time-limited recovery link to your email address, where you can choose a new password.",
  },
];

export default function FaqPage() {
  return (
    <PublicPage>
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 sm:py-28">
        <Badge className="border border-cyan-300/20 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/10">FAQ</Badge>
        <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">Clear answers before you get started.</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
          Learn how files, analysis reports, job matching, privacy, and account recovery work.
        </p>

        <div className="mt-12 divide-y divide-white/10 rounded-2xl border border-white/10 bg-slate-900/70 px-6">
          {questions.map(({ question, answer }) => (
            <details key={question} className="group py-5">
              <summary className="cursor-pointer list-none pr-8 text-lg font-semibold text-white marker:hidden">
                <span className="flex items-center justify-between gap-4">
                  {question}
                  <span className="text-cyan-300 transition group-open:rotate-45" aria-hidden="true">+</span>
                </span>
              </summary>
              <p className="mt-4 max-w-3xl leading-7 text-slate-300">{answer}</p>
            </details>
          ))}
        </div>
      </section>
    </PublicPage>
  );
}
