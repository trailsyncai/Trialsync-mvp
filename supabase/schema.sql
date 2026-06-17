-- ============================================================
-- TrialSync MVP — database schema
-- Run this in Supabase: Dashboard → SQL Editor → New query → paste → Run
-- ============================================================

-- One row per saved patient-trial match run, owned by a user.
create table if not exists public.match_runs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  patient_label   text not null,
  trial_name      text not null,
  criteria        jsonb not null default '[]'::jsonb,
  criteria_met    integer not null default 0,
  criteria_total  integer not null default 0,
  eligible        boolean not null default false,
  created_at      timestamptz not null default now()
);

create index if not exists match_runs_user_id_created_at_idx
  on public.match_runs (user_id, created_at desc);

-- ------------------------------------------------------------
-- Row-Level Security: each user can only see/modify their OWN rows.
-- This is what isolates data per account (rubric requirement).
-- ------------------------------------------------------------
alter table public.match_runs enable row level security;

drop policy if exists "select own runs" on public.match_runs;
create policy "select own runs"
  on public.match_runs for select
  using (auth.uid() = user_id);

drop policy if exists "insert own runs" on public.match_runs;
create policy "insert own runs"
  on public.match_runs for insert
  with check (auth.uid() = user_id);

drop policy if exists "update own runs" on public.match_runs;
create policy "update own runs"
  on public.match_runs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "delete own runs" on public.match_runs;
create policy "delete own runs"
  on public.match_runs for delete
  using (auth.uid() = user_id);
