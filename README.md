# Aura Dashboard

A Next.js dashboard application with Supabase authentication and session handling.

## Recent Changes

### Supabase client initialization fix

The app was throwing a runtime error on every request:

```
Error: Your project's URL and Key are required to create a Supabase client!
    at updateSession (lib/supabase/proxy.ts)
```

This happened because `createServerClient` was called unconditionally, even when the
Supabase environment variables were not yet available. If the keys were missing, the
proxy threw and crashed the entire app.

**Fix:** `lib/supabase/proxy.ts` now reads the env vars into locals and guards against
missing values. When `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` are
absent, the proxy gracefully skips Supabase session handling and returns the default
response instead of throwing.

```ts
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// If Supabase env vars aren't configured yet, skip auth handling instead of
// throwing so the app can still render.
if (!supabaseUrl || !supabaseAnonKey) {
  return supabaseResponse
}
```

## Environment Variables

The following variables must be set (provided by the Supabase integration):

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

## Getting Started

```bash
pnpm install
pnpm dev
```

The app runs on [http://localhost:3000](http://localhost:3000).

## Build & Deploy

```bash
pnpm build      # production build
vercel --prod   # deploy to Vercel
```
