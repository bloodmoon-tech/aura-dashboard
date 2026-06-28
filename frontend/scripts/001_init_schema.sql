-- Aura: AI-powered candidate validation engine
-- Schema, pgvector memory, and Row Level Security policies

-- 1. Enable pgvector for semantic code search
create extension if not exists vector;

-- =========================================================
-- TABLES
-- =========================================================

-- Recruiters (linked to Supabase auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  company_name text,
  created_at timestamptz not null default now()
);

-- Candidates being evaluated
create table if not exists public.candidates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  github_url text,
  created_at timestamptz not null default now()
);

-- Evaluations: the AI "memory" with embeddings for semantic search
create table if not exists public.evaluations (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  recruiter_id uuid not null references public.users(id) on delete cascade,
  skill_score int check (skill_score between 0 and 100),
  summary jsonb,
  code_embedding vector(1536),
  created_at timestamptz not null default now()
);

-- =========================================================
-- INDEXES (B-tree on FKs used in RLS policies)
-- =========================================================
create index if not exists idx_evaluations_recruiter_id on public.evaluations (recruiter_id);
create index if not exists idx_evaluations_candidate_id on public.evaluations (candidate_id);

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
alter table public.users enable row level security;
alter table public.candidates enable row level security;
alter table public.evaluations enable row level security;

-- users: a recruiter can only see / manage their own row
drop policy if exists "users_select_own" on public.users;
create policy "users_select_own" on public.users
  for select using ( (select auth.uid()) = id );

drop policy if exists "users_insert_own" on public.users;
create policy "users_insert_own" on public.users
  for insert with check ( (select auth.uid()) = id );

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own" on public.users
  for update using ( (select auth.uid()) = id );

drop policy if exists "users_delete_own" on public.users;
create policy "users_delete_own" on public.users
  for delete using ( (select auth.uid()) = id );

-- candidates: any authenticated recruiter may read/insert candidates,
-- since candidates themselves are not owned (the evaluations are scoped per recruiter)
drop policy if exists "candidates_select_auth" on public.candidates;
create policy "candidates_select_auth" on public.candidates
  for select using ( (select auth.uid()) is not null );

drop policy if exists "candidates_insert_auth" on public.candidates;
create policy "candidates_insert_auth" on public.candidates
  for insert with check ( (select auth.uid()) is not null );

drop policy if exists "candidates_update_auth" on public.candidates;
create policy "candidates_update_auth" on public.candidates
  for update using ( (select auth.uid()) is not null );

-- evaluations: strict per-recruiter ownership (cached auth.uid for performance)
drop policy if exists "evaluations_select_own" on public.evaluations;
create policy "evaluations_select_own" on public.evaluations
  for select using ( (select auth.uid()) = recruiter_id );

drop policy if exists "evaluations_insert_own" on public.evaluations;
create policy "evaluations_insert_own" on public.evaluations
  for insert with check ( (select auth.uid()) = recruiter_id );

drop policy if exists "evaluations_update_own" on public.evaluations;
create policy "evaluations_update_own" on public.evaluations
  for update using ( (select auth.uid()) = recruiter_id );

drop policy if exists "evaluations_delete_own" on public.evaluations;
create policy "evaluations_delete_own" on public.evaluations
  for delete using ( (select auth.uid()) = recruiter_id );

-- =========================================================
-- AUTO-CREATE RECRUITER PROFILE ON SIGNUP
-- =========================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, company_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'company_name', null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
