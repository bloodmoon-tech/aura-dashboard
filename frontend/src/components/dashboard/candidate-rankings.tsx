"use client"

import { useMemo, useState } from "react"
import type { Candidate, JobRole } from "@/lib/types"
import { scoreTone, STATUS_LABELS } from "@/lib/score"
import { DeepDiveDrawer } from "@/components/dashboard/deep-dive-drawer"
import { NewScanDialog } from "@/components/dashboard/new-scan-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search, Users, CheckCircle2 } from "lucide-react"

interface RankingsProps {
  role: JobRole
  candidates: Candidate[]
}

const STATUS_DOT: Record<string, string> = {
  completed: "bg-emerald-500",
  portfolio_analyzed: "bg-primary",
  github_scanned: "bg-amber-500",
  scanning: "bg-muted-foreground animate-pulse",
}

export function CandidateRankings({ role, candidates }: RankingsProps) {
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<Candidate | null>(null)
  const [open, setOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return candidates
    return candidates.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.frameworks.some((f) => f.toLowerCase().includes(q)),
    )
  }, [candidates, query])

  const validated = candidates.filter((c) => c.status === "completed").length

  function openCandidate(c: Candidate) {
    setSelected(c)
    setOpen(true)
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="border-b bg-card px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-pretty text-xl font-semibold">{role.title}</h1>
            <p className="text-sm text-muted-foreground">{role.description}</p>
          </div>
          <NewScanDialog />
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="size-4" />
              {candidates.length} evaluated
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-emerald-600" />
              {validated} fully validated
            </span>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or framework…"
              className="pl-9"
              aria-label="Search candidates"
            />
          </div>
        </div>
      </header>

      {/* Table */}
      <div className="p-6">
        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead>Candidate</TableHead>
                <TableHead className="w-[240px]">Proof-of-Skill</TableHead>
                <TableHead className="hidden md:table-cell">Top frameworks</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c, idx) => {
                const tone = scoreTone(c.skillScore)
                return (
                  <TableRow
                    key={c.id}
                    onClick={() => openCandidate(c)}
                    className="cursor-pointer"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        openCandidate(c)
                      }
                    }}
                  >
                    <TableCell className="text-center font-medium tabular-nums text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                            {c.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col leading-tight">
                          <span className="font-medium">{c.name}</span>
                          <span className="text-xs text-muted-foreground">{c.title}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className={`w-8 text-sm font-semibold tabular-nums ${tone.text}`}>
                          {c.skillScore}
                        </span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full ${tone.bar}`}
                            style={{ width: `${c.skillScore}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-wrap gap-1.5">
                        {c.frameworks.slice(0, 3).map((f) => (
                          <Badge key={f} variant="secondary" className="font-normal">
                            {f}
                          </Badge>
                        ))}
                        {c.frameworks.length > 3 && (
                          <Badge variant="outline" className="font-normal">
                            +{c.frameworks.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span
                          className={`size-2 rounded-full ${STATUS_DOT[c.status] ?? "bg-muted-foreground"}`}
                        />
                        {STATUS_LABELS[c.status]}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}
              {filtered.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                    No candidates match {`"${query}"`}.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <DeepDiveDrawer candidate={selected} open={open} onOpenChange={setOpen} />
    </div>
  )
}
