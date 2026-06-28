"use client"

import { useActionState } from "react"
import Link from "next/link"
import { useFormStatus } from "react-dom"
import { signIn, type AuthState } from "@/app/auth/actions"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      Sign in
    </Button>
  )
}

export function LoginForm() {
  const [state, formAction] = useActionState<AuthState, FormData>(signIn, undefined)

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your recruiter workspace.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          {state?.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}

          <SubmitButton />

          <p className="text-center text-sm text-muted-foreground">
            {"Don't have an account? "}
            <Link href="/auth/sign-up" className="font-medium text-primary hover:underline">
              Create one
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
