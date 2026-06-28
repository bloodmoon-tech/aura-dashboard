"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export type AuthState = { error?: string } | undefined

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "")
  const password = String(formData.get("password") ?? "")

  if (!email || !password) {
    return { error: "Email and password are required." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  redirect("/dashboard")
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "")
  const password = String(formData.get("password") ?? "")
  const companyName = String(formData.get("company_name") ?? "")

  if (!email || !password) {
    return { error: "Email and password are required." }
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." }
  }

  const supabase = await createClient()
  const emailRedirectTo =
    process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
    `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/auth/callback`

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
      data: { company_name: companyName },
    },
  })

  if (error) {
    return { error: error.message }
  }

  redirect("/auth/sign-up-success")
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
