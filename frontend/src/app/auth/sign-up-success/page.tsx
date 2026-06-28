import { AuthLayout } from "@/components/auth/auth-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MailCheck } from "lucide-react"
import Link from "next/link"

export default function SignUpSuccessPage() {
  return (
    <AuthLayout>
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="space-y-3">
          <div className="flex size-11 items-center justify-center rounded-lg bg-accent">
            <MailCheck className="size-5 text-accent-foreground" />
          </div>
          <CardTitle className="text-xl">Check your inbox</CardTitle>
          <CardDescription>
            We sent a confirmation link to your email. Confirm it to activate your workspace, then
            sign in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" render={<Link href="/login" />}>
            Back to sign in
          </Button>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
