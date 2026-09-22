"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-4 text-white">
      <section className="max-w-md rounded-2xl border border-red-400/20 bg-slate-900 p-8 text-center">
        <p className="text-sm font-medium text-red-300">Something went wrong</p>

        <h1 className="mt-3 text-3xl font-bold">
          We could not load this page.
        </h1>

        <p className="mt-3 text-slate-300">
          Your data remains private. Please try again.
        </p>

        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-lg bg-cyan-400 px-5 py-2.5 font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
