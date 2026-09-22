import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-4 text-white">
      <section className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-cyan-300">
          404
        </p>

        <h1 className="mt-3 text-4xl font-bold">Page not found</h1>

        <p className="mt-4 text-slate-300">
          This page does not exist, or you may not have permission to access it.
        </p>

        <Link
          href="/dashboard"
          className="mt-7 inline-flex rounded-lg bg-cyan-400 px-5 py-2.5 font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          Go to dashboard
        </Link>
      </section>
    </main>
  );
}
