import type { ReactNode } from "react"
import { Sparkles } from "lucide-react"

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-svh flex-col lg:flex-row">
      {/* Brand panel */}
      <div className="relative hidden w-full bg-sidebar lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:p-12">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="size-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-sidebar-foreground">Aura</span>
        </div>

        <div className="max-w-md">
          <h1 className="text-balance text-3xl font-semibold leading-tight text-sidebar-foreground">
            Hire on proof, not on paper.
          </h1>
          <p className="mt-4 text-pretty leading-relaxed text-sidebar-foreground/70">
            Aura replaces resumes with AI-generated Proof-of-Skill scores, validated against real
            GitHub and portfolio evidence — so you can rank candidates by what they actually build.
          </p>
        </div>

        <dl className="grid grid-cols-3 gap-6">
          {[
            { k: "Proof-of-Skill", v: "0–100" },
            { k: "Evidence-backed", v: "100%" },
            { k: "Bias signal", v: "Removed" },
          ].map((s) => (
            <div key={s.k}>
              <dt className="text-2xl font-semibold text-sidebar-foreground">{s.v}</dt>
              <dd className="mt-1 text-xs text-sidebar-foreground/60">{s.k}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-1 items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </main>
  )
}
