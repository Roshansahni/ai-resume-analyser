import Link from "next/link";
import { CircleAlert, FileSearch } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AuthErrorPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-4 text-slate-50">
      <Card className="w-full max-w-md border-white/10 bg-slate-900/80">
        <CardHeader>
          <span className="mb-3 grid size-11 place-items-center rounded-xl bg-red-500/10 text-red-300">
            <CircleAlert className="size-5" aria-hidden="true" />
          </span>
          <CardTitle className="text-2xl text-white">
            Confirmation link could not be verified
          </CardTitle>
          <CardDescription className="text-slate-400">
            The link may have expired or already been used. Try signing in, or create
            your account again.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Button asChild className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">
            <Link href="/login">Go to login</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            <Link href="/signup">
              <FileSearch className="size-4" aria-hidden="true" />
              Create account
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}