import { AuthLayout } from "@/components/auth/auth-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { TriangleAlert } from "lucide-react"
import Link from "next/link"

export default function AuthErrorPage() {
  return (
    <AuthLayout>
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="space-y-3">
          <div className="flex size-11 items-center justify-center rounded-lg bg-destructive/10">
            <TriangleAlert className="size-5 text-destructive" />
          </div>
          <CardTitle className="text-xl">Authentication error</CardTitle>
          <CardDescription>
            Something went wrong while confirming your session. Please try signing in again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login" className={buttonVariants({ className: "w-full" })}>
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
