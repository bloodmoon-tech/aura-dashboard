// import { AuthLayout } from "@/components/auth/auth-layout"
// import { LoginForm } from "@/components/auth/login-form"
// import { createClient } from "@/lib/supabase/server"
// import { redirect } from "next/navigation"

// export default async function LoginPage() {
//   const supabase = await createClient()
//   const {
//     data: { user },
//   } = await supabase.auth.getUser()
//   if (user) redirect("/dashboard")

//   return (
//     <AuthLayout>
//       <LoginForm />
//     </AuthLayout>
//   )
// }



'use client'

import React, { useState } from 'react'
import { loginWithEmailAndPassword } from './actions'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setErrorMsg(null)
    
    const formData = new FormData(e.currentTarget)
    const result = await loginWithEmailAndPassword(formData)
    
    if (result?.error) {
      setErrorMsg(result.error)
      setIsPending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 dark:bg-slate-900">
      <div className="w-full max-w-md space-y-4">
        <div className="flex flex-col items-center justify-center space-y-2 text-center mb-2">
          <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-md">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Aura Platform</h1>
          <p className="text-sm text-slate-500">Autonomous Technical Ingestion & Screening</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="border-slate-200 shadow-xl dark:border-slate-800">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl font-semibold">Sign in</CardTitle>
              <CardDescription>Enter your workspace credentials below to manage candidate pipelines</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {errorMsg && (
                <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200">
                  <AlertDescription className="text-xs font-medium">{errorMsg}</AlertDescription>
                </Alert>
              )}
              <div className="grid gap-2">
                <Label htmlFor="email">Work Email</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  autoComplete="email" 
                  placeholder="recruiter@company.com" 
                  required 
                  disabled={isPending}
                  className="bg-white"
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  autoComplete="current-password" 
                  required 
                  disabled={isPending}
                  className="bg-white"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Authenticating Session...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  )
}