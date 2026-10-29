import { Skeleton } from "@/components/ui/skeleton";

export default function AnalysisLoading() {
  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <Skeleton className="h-5 w-24 bg-slate-800" />
        <Skeleton className="h-10 w-64 bg-slate-800" />
        <Skeleton className="h-5 w-full max-w-xl bg-slate-800" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-40 bg-slate-900" />
          <Skeleton className="h-40 bg-slate-900" />
        </div>
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <Skeleton className="h-64 bg-slate-900" />
          <Skeleton className="h-64 bg-slate-900" />
        </div>
      </div>
    </main>
  );
}
