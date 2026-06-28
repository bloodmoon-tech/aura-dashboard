"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function NewScanDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [githubUrl, setGithubUrl] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, githubUrl }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? "Scan failed")
        return
      }
      toast.success(
        `Validated ${data.candidate.name} — Proof-of-Skill ${data.evaluation.skill_score}`,
      )
      setName("")
      setGithubUrl("")
      setOpen(false)
      router.refresh()
    } catch {
      toast.error("Could not reach the validation service.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        New scan
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            Validate a candidate
          </DialogTitle>
          <DialogDescription>
            Aura scans the candidate&apos;s GitHub history and produces an
            evidence-backed Proof-of-Skill score.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="scan-name">Candidate name (optional)</Label>
            <Input
              id="scan-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jordan Smith"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="scan-url">GitHub profile or repo URL</Label>
            <Input
              id="scan-url"
              required
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/username"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              {loading ? "Scanning…" : "Run validation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
