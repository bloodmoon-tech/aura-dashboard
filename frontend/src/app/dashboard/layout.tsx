import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { JOB_ROLES } from "@/lib/mock-data"
import { DashboardSidebar } from "@/components/dashboard/sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
    return null
  }

  const profile = {
    email: user.email ?? "recruiter@aura.app",
    company: (user.user_metadata?.company_name as string | undefined) ?? null,
  }

  return (
    <div className="flex h-svh overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden w-64 shrink-0 md:block">
        <DashboardSidebar roles={JOB_ROLES} activeRoleId="" user={profile} />
      </div>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
