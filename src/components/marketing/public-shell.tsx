import Link from "next/link";
import type { ReactNode } from "react";
import { FileSearch } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/85 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-9 place-items-center rounded-xl bg-cyan-400 text-slate-950">
            <FileSearch className="size-5" aria-hidden="true" />
          </span>
          <span>AI Resume Analyser</span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm text-slate-300 lg:flex" aria-label="Main navigation">
          <Link href="/#features" className="transition hover:text-white">Features</Link>
          <Link href="/#how-it-works" className="transition hover:text-white">How it works</Link>
          <Link href="/about" className="transition hover:text-white">About</Link>
          <Link href="/faq" className="transition hover:text-white">FAQ</Link>
          <Link href="/contact" className="transition hover:text-white">Contact</Link>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Button asChild variant="ghost" className="hidden text-slate-200 hover:bg-white/10 hover:text-white sm:inline-flex">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
            <Link href="/signup">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>© 2026 AI Resume Analyser. Built for academic and professional use.</p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Footer navigation">
          <Link href="/about" className="hover:text-white">About</Link>
          <Link href="/faq" className="hover:text-white">FAQ</Link>
          <Link href="/contact" className="hover:text-white">Contact</Link>
          <Link href="/login" className="hover:text-white">Sign in</Link>
        </nav>
      </div>
    </footer>
  );
}

export function PublicPage({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <PublicHeader />
      {children}
      <PublicFooter />
    </main>
  );
}
