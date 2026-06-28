export type ValidationStatus =
  | "scanning"
  | "github_scanned"
  | "portfolio_analyzed"
  | "completed"

export type ScanStatus = "processing" | "rate_limited" | "completed" | "failed"

export interface CodeEvidence {
  type: "snippet" | "commit"
  repo: string
  label: string
  content: string
  language?: string
}

export interface Candidate {
  id: string
  name: string
  title: string
  avatarUrl?: string
  githubUrl: string
  portfolioUrl?: string
  location: string
  skillScore: number
  frameworks: string[]
  status: ValidationStatus
  summary: string[]
  evidence: CodeEvidence[]
  scannedAt: string
}

export interface JobRole {
  id: string
  title: string
  description: string
  candidateCount: number
}
