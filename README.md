# TrialSync AI — MVP

A live, deployable web app for the venture pitched in Chapter 5. Clinical research
coordinators sign in, run a patient-against-trial eligibility check, and **save, edit,
and delete "match runs"** that persist to their own private account.

This is the Lab "deployed MVP" deliverable. It satisfies every requirement:

| Requirement | How it's met |
|---|---|
| **Authentication** | Supabase Auth — email/password sign up, sign in, sign out. |
| **Per-account data isolation** | Postgres **Row-Level Security**: a user can only read/write their own rows (`supabase/schema.sql`). |
| **Database entity that persists** | `match_runs` table in Supabase Postgres. |
| **Transaction flow (create/modify/delete via UI)** | New AI match run, edit run, and delete run are all done through the UI. |
| **Basic analytics** | PostHog captures `match_run_created` and `ai_match_run` (plus sign-in/up/delete). |
| **Reproducible from README** | These instructions. |

**Stack:** Next.js 14 (App Router) · Supabase (Postgres + Auth) · Google Gemini (AI matching) · PostHog · deploys on Vercel.

## What it does
A logged-in user clicks **New match run**, then **pastes or uploads** (PDF/.txt) a patient's
information and a trial's eligibility rules. They click **Run AI match**; the app sends both
to Google Gemini server-side, which returns a **rule-by-rule eligibility verdict** (met /
fails / unclear) with the source and reasoning for each, plus an overall eligible result. The
user saves that run to their private account, where they can view, edit, and delete it.

---

## Run it locally

### 0. Prerequisites
- **Node.js 18.18+** (`node -v` to check). Install from https://nodejs.org if needed.
- A free **Supabase** account (https://supabase.com).
- A free **PostHog** account (https://posthog.com).

### 1. Clone and install
```bash
git clone <YOUR-REPO-URL>
cd trialsync-mvp
npm install
```

### 2. Create the Supabase project + table
1. In Supabase, click **New project**. Pick any name and a database password. Wait for it to provision.
2. Go to **SQL Editor → New query**, open `supabase/schema.sql` from this repo, paste the whole file in, and click **Run**. This creates the `match_runs` table and the Row-Level Security policies that keep each user's data private.
3. Go to **Settings → API** and copy two values: the **Project URL** and the **anon public** key.
4. (Recommended for grading) Go to **Authentication → Providers → Email** and turn **"Confirm email" OFF**, so the grader can sign up and use the app immediately without a confirmation email. (If you leave it on, new users must click an email link before signing in.)

### 3. Create the PostHog project
1. In PostHog, create a project. Go to **Settings → Project → Project API Key** and copy the key (starts with `phc_`).
2. Note your host: usually `https://us.i.posthog.com` (US) or `https://eu.i.posthog.com` (EU).

### 3b. Get a free Google Gemini API key (powers the AI matching)
1. Go to **https://aistudio.google.com/apikey** and sign in with a Google account.
2. Click **Create API key** (the free tier needs no credit card). Copy the key.

### 4. Add environment variables
Copy the example file and fill in your values:
```bash
cp .env.example .env.local
```
Then edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
NEXT_PUBLIC_POSTHOG_KEY=phc_YOUR_KEY
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
GEMINI_API_KEY=YOUR-GEMINI-KEY
```
> `GEMINI_API_KEY` has **no** `NEXT_PUBLIC_` prefix on purpose — it stays server-side and is never sent to the browser.

### 5. Run
```bash
npm run dev
```
Open http://localhost:3000. Sign up, create a match run, and you're in.

---

## Deploy to Vercel (the live URL)

1. Push this repo to GitHub (see below).
2. Go to https://vercel.com, click **Add New → Project**, and import your GitHub repo.
3. Before clicking Deploy, expand **Environment Variables** and add the same five
   variables from your `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_POSTHOG_KEY`,
   `NEXT_PUBLIC_POSTHOG_HOST`, and `GEMINI_API_KEY`).
4. Click **Deploy**. Vercel gives you a live `https://your-app.vercel.app` URL.
5. **One required Supabase setting for the live URL:** in Supabase go to
   **Authentication → URL Configuration** and add your Vercel URL to **Site URL**
   and **Redirect URLs**, so auth works on the deployed domain.

That deployed URL is accessible with no credentials from the grader — they can sign up
with their own email and use it immediately.

---

## Push to GitHub
```bash
git init
git add .
git commit -m "TrialSync MVP"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```
Make the repo **public** (or grant the grader access). `.env.local` is gitignored, so
your keys are never committed.

---

## How to verify each requirement (for the grader)

- **Auth + isolation:** sign up as user A, save a run. Sign out, sign up as user B —
  user B sees an empty dashboard, never user A's run. (Enforced in the database by RLS,
  not just the UI.)
- **Persistence:** save a run, sign out, sign back in — it's still there.
- **Create/modify/delete:** "New match run" creates; the run page's **Edit** modifies;
  **Delete** removes. All through the UI.
- **Analytics:** in PostHog → **Activity** (or Events), you'll see `match_run_created`
  fire when you save a run, plus `user_signed_in`, `user_signed_up`,
  `match_run_updated`, and `match_run_deleted`.
- **Health check:** `GET /api/health` returns `{"status":"ok"}`.

---

## Project structure
```
app/
  page.tsx              # redirects to /dashboard or /login based on auth
  login/page.tsx        # sign up + sign in
  dashboard/page.tsx    # lists the signed-in user's saved runs
  match/new/page.tsx    # create a run
  match/[id]/page.tsx   # view / edit / delete a run
  api/health/route.ts   # health check
components/
  match-form.tsx        # create + edit form (fires match_run_created)
  run-detail.tsx        # view + edit toggle + delete
  topbar.tsx            # brand bar + sign out
  analytics.tsx         # PostHog provider
lib/
  supabase-client.ts    # browser Supabase client
  supabase-server.ts    # server Supabase client
middleware.ts           # session refresh + route protection
supabase/schema.sql     # table + Row-Level Security policies
```

## Notes
- If `NEXT_PUBLIC_POSTHOG_KEY` is left blank, the app still runs; analytics is simply
  disabled. Set it to capture events.
- The eligibility verdicts here are entered/saved by the user. The *automated* matching
  engine (live AI scoring) is the separate demo prototype; see the scope note below.
