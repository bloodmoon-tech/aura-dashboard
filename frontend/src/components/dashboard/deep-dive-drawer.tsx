"use client"

import type { Candidate } from "@/lib/types"
import { scoreTone, STATUS_LABELS } from "@/lib/score"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Sparkles, FileCode2, GitCommitHorizontal } from "lucide-react"

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
)

interface DeepDiveProps {
  candidate: Candidate | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeepDiveDrawer({ candidate, open, onOpenChange }: DeepDiveProps) {
  if (!candidate) return null
  const tone = scoreTone(candidate.skillScore)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-xl">
        {/* Header */}
        <SheetHeader className="space-y-0 border-b bg-card p-6">
          <div className="flex items-start gap-4">
            <Avatar className="size-14">
              <AvatarFallback className="bg-primary/10 text-base font-medium text-primary">
                {candidate.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-xl">{candidate.name}</SheetTitle>
              <SheetDescription className="mt-0.5">
                {candidate.title} · {candidate.location}
              </SheetDescription>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" render={<a href={candidate.githubUrl} target="_blank" rel="noopener noreferrer" />}>
                  <GithubIcon className="size-4" />
                  GitHub
                </Button>
                {candidate.portfolioUrl && (
                  <Button size="sm" variant="outline" render={<a href={candidate.portfolioUrl} target="_blank" rel="noopener noreferrer" />}>
                    <ExternalLink className="size-4" />
                    Portfolio
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Score */}
          <div className="mt-5 flex items-center gap-4 rounded-lg border bg-background p-4">
            <div className="flex flex-col items-center">
              <span className={`text-3xl font-semibold tabular-nums ${tone.text}`}>
                {candidate.skillScore}
              </span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Proof-of-Skill</span>
                <span className={`text-xs font-medium ${tone.text}`}>{tone.label}</span>
              </div>
              <div
                className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuenow={candidate.skillScore}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className={`h-full rounded-full ${tone.bar}`}
                  style={{ width: `${candidate.skillScore}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {STATUS_LABELS[candidate.status]}
              </p>
            </div>
          </div>
        </SheetHeader>

        {/* Body */}
        <div className="flex flex-col gap-6 p-6">
          {/* Frameworks */}
          <section>
            <h3 className="text-sm font-medium text-muted-foreground">Top frameworks</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {candidate.frameworks.map((f) => (
                <Badge key={f} variant="secondary">
                  {f}
                </Badge>
              ))}
            </div>
          </section>

          {/* AI Summary */}
          <section className="rounded-lg border bg-accent/40 p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <h3 className="text-sm font-semibold">AI summary</h3>
            </div>
            <ul className="mt-3 flex flex-col gap-2.5">
              {candidate.summary.map((point, i) => (
                <li key={i} className="flex gap-2.5 text-sm leading-relaxed">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span className="text-foreground/90">{point}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Evidence */}
          <section>
            <h3 className="text-sm font-semibold">Evidence</h3>
            <p className="text-xs text-muted-foreground">
              Code and commits the AI used to validate this score.
            </p>
            <div className="mt-3 flex flex-col gap-3">
              {candidate.evidence.map((ev, i) => (
                <div key={i} className="overflow-hidden rounded-lg border">
                  <div className="flex items-center gap-2 border-b bg-muted/50 px-3 py-2">
                    {ev.type === "snippet" ? (
                      <FileCode2 className="size-3.5 text-muted-foreground" />
                    ) : (
                      <GitCommitHorizontal className="size-3.5 text-muted-foreground" />
                    )}
                    <span className="text-xs font-medium">{ev.label}</span>
                    <span className="ml-auto truncate font-mono text-xs text-muted-foreground">
                      {ev.repo}
                    </span>
                  </div>
                  <pre className="overflow-x-auto bg-card px-3 py-3 font-mono text-xs leading-relaxed text-foreground/90">
                    <code>{ev.content}</code>
                  </pre>
                </div>
              ))}
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
