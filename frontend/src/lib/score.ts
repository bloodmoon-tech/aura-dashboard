import type { ValidationStatus } from "@/lib/types"

export function scoreTone(score: number): {
  label: string
  text: string
  bar: string
  bg: string
} {
  if (score >= 85) {
    return {
      label: "Exceptional",
      text: "text-emerald-600",
      bar: "bg-emerald-500",
      bg: "bg-emerald-50",
    }
  }
  if (score >= 70) {
    return {
      label: "Strong",
      text: "text-primary",
      bar: "bg-primary",
      bg: "bg-accent",
    }
  }
  return {
    label: "Developing",
    text: "text-amber-600",
    bar: "bg-amber-500",
    bg: "bg-amber-50",
  }
}

export const STATUS_LABELS: Record<ValidationStatus, string> = {
  scanning: "Scanning…",
  github_scanned: "GitHub scanned",
  portfolio_analyzed: "Portfolio analyzed",
  completed: "Fully validated",
}
