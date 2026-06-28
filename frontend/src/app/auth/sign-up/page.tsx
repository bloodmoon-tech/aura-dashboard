import { AuthLayout } from "@/components/auth/auth-layout"
import { SignUpForm } from "@/components/auth/sign-up-form"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function SignUpPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) redirect("/dashboard")

  return (
    <AuthLayout>
      <SignUpForm />
    </AuthLayout>
  )
}
