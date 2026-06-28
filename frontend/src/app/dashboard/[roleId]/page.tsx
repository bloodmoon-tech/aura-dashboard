import { notFound } from "next/navigation"
import { getCandidates, getRole } from "@/lib/mock-data"
import { CandidateRankings } from "@/components/dashboard/candidate-rankings"

export default async function RolePage({
  params,
}: {
  params: Promise<{ roleId: string }>
}) {
  const { roleId } = await params
  const role = getRole(roleId)
  if (!role) {
    notFound()
  }
  const candidates = getCandidates(roleId)

  return <CandidateRankings role={role} candidates={candidates} />
}
