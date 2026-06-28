import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Mock validation pipeline.
 *
 * In production this work would run in the Python FastAPI service:
 *   1. Scan the candidate's GitHub repositories
 *   2. Analyze portfolio / live projects
 *   3. Run a LangChain evaluation chain to produce a Proof-of-Skill score
 *      and an evidence-backed summary, embedding the code for semantic recall.
 *
 * Here we deterministically derive a plausible score + summary from the
 * submitted GitHub URL, then persist a recruiter-scoped evaluation row.
 */

function hashString(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function deriveEvaluation(githubUrl: string) {
  const handle = githubUrl.replace(/\/+$/, "").split("/").pop() || "candidate"
  const seed = hashString(githubUrl)
  const skillScore = 58 + (seed % 42) // 58 - 99
  const summary = [
    `Repositories under @${handle} show consistent, well-scoped commit history with clear intent.`,
    skillScore >= 85
      ? "Advanced patterns are evident: strong typing, tested critical paths, and thoughtful error handling."
      : "Fundamentals are solid, though complex state and edge-case handling appear less frequently.",
    "Code embeddings were generated for semantic retrieval against future role requirements.",
  ]
  return { handle, skillScore, summary }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { name?: string; githubUrl?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const githubUrl = body.githubUrl?.trim()
  if (!githubUrl || !/^https?:\/\/(www\.)?github\.com\/.+/.test(githubUrl)) {
    return NextResponse.json(
      { error: "A valid GitHub profile or repository URL is required." },
      { status: 422 },
    )
  }

  const { handle, skillScore, summary } = deriveEvaluation(githubUrl)
  const name = body.name?.trim() || handle

  // 1. Persist the candidate
  const { data: candidate, error: candidateError } = await supabase
    .from("candidates")
    .insert({ name, github_url: githubUrl })
    .select("id")
    .single()

  if (candidateError || !candidate) {
    return NextResponse.json(
      { error: candidateError?.message ?? "Failed to create candidate" },
      { status: 500 },
    )
  }

  // 2. Persist the recruiter-scoped evaluation (RLS enforces recruiter_id = auth.uid())
  const { data: evaluation, error: evalError } = await supabase
    .from("evaluations")
    .insert({
      candidate_id: candidate.id,
      recruiter_id: user.id,
      skill_score: skillScore,
      summary,
    })
    .select("id, skill_score, summary, created_at")
    .single()

  if (evalError || !evaluation) {
    return NextResponse.json(
      { error: evalError?.message ?? "Failed to store evaluation" },
      { status: 500 },
    )
  }

  return NextResponse.json({
    status: "completed",
    candidate: { id: candidate.id, name, githubUrl },
    evaluation,
  })
}
