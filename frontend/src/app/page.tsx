import Link from "next/link"
import { redirect } from "next/navigation"
import { Sparkles, GitBranch, ShieldCheck, Gauge, ArrowRight } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) redirect("/dashboard")

  const features = [
    {
      icon: GitBranch,
      title: "Proof of Skill, not paper",
      body: "Aura scans real GitHub repositories and live portfolios, then scores candidates on the code they actually shipped.",
    },
    {
      icon: ShieldCheck,
      title: "Evidence-backed scores",
      body: "Every Skill Score links to concrete commits and snippets, so hiring decisions trace back to verifiable work.",
    },
    {
      icon: Gauge,
      title: "Ranked in seconds",
      body: "Candidates are validated asynchronously and ranked per role, so your shortlist is ready before the first call.",
    },
  ]

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="size-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Aura</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" render={<Link href="/login" />}>
            Sign in
          </Button>
          <Button render={<Link href="/auth/sign-up" />}>
            Get started
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6">
        <section className="flex flex-col items-center py-20 text-center md:py-28">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
            <Sparkles className="size-3" />
            AI candidate validation engine
          </span>
          <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
            Stop reading resumes. Start trusting the code.
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            Aura replaces self-reported resumes with AI-generated Proof-of-Skill
            scores, built from a candidate&apos;s real GitHub history and portfolio
            evidence.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" render={<Link href="/auth/sign-up" />}>
              Start validating
              <ArrowRight className="size-4" />
            </Button>
            <Button size="lg" variant="outline" render={<Link href="/login" />}>
              Sign in
            </Button>
          </div>
        </section>

        <section className="grid gap-5 pb-24 md:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-border bg-card p-6 shadow-sm"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-accent">
                <f.icon className="size-5 text-accent-foreground" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.body}
              </p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 text-sm text-muted-foreground">
          <span>Aura — AI Candidate Validation</span>
          <span>Built for technical hiring teams</span>
        </div>
      </footer>
    </div>
  )
}
