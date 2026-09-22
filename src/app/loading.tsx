export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-16 text-white">
      <div className="mx-auto max-w-5xl animate-pulse space-y-6">
        <div className="h-10 w-52 rounded bg-slate-800" />
        <div className="h-8 w-80 rounded bg-slate-800" />

        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-36 rounded-2xl bg-slate-900" />
          ))}
        </div>
      </div>
    </main>
  );
}
