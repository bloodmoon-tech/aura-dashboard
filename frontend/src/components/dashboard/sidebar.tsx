"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sparkles, Code2, Server, BarChart3, Settings, LogOut } from "lucide-react"
import type { JobRole } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { signOut } from "@/app/auth/actions"

const ROLE_ICONS: Record<string, typeof Code2> = {
  "frontend-developer": Code2,
  "backend-engineer": Server,
  "data-scientist": BarChart3,
}

interface SidebarProps {
  roles: JobRole[]
  activeRoleId: string
  user: { email: string; company?: string | null }
}

export function DashboardSidebar({ roles, activeRoleId, user }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
          <Sparkles className="size-4 text-primary-foreground" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold">Aura</span>
          <span className="text-xs text-sidebar-foreground/60">AI Validation</span>
        </div>
      </div>

      {/* Roles */}
      <nav className="flex-1 px-3 py-2" aria-label="Job roles">
        <p className="px-2 pb-2 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/50">
          Active roles
        </p>
        <ul className="flex flex-col gap-1">
          {roles.map((role) => {
            const Icon = ROLE_ICONS[role.id] ?? Code2
            const href = `/dashboard/${role.id}`
            const active = pathname === href || activeRoleId === role.id
            return (
              <li key={role.id}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-md px-2 py-2 text-sm transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="size-4 shrink-0" />
                    {role.title}
                  </span>
                  <span className="rounded-full bg-sidebar-foreground/10 px-1.5 py-0.5 text-xs tabular-nums">
                    {role.candidateCount}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer: settings + profile */}
      <div className="border-t border-sidebar-border px-3 py-3">
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
        >
          <Settings className="size-4" />
          Settings
        </button>

        <div className="mt-2 flex items-center gap-2.5 rounded-md px-2 py-2">
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary/20 text-xs text-sidebar-foreground">
              {user.email.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-medium">
              {user.company || "Recruiter"}
            </span>
            <span className="truncate text-xs text-sidebar-foreground/60">{user.email}</span>
          </div>
          <form action={signOut} className="ml-auto">
            <button
              type="submit"
              aria-label="Sign out"
              className="rounded-md p-1.5 text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            >
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  )
}
