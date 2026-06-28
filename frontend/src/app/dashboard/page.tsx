import { redirect } from "next/navigation"
import { JOB_ROLES } from "@/lib/mock-data"

export default function DashboardIndex() {
  redirect(`/dashboard/${JOB_ROLES[0].id}`)
}
