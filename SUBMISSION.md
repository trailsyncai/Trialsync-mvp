# Submission notes

## The one feature I cut from scope to ship on time — and why

I cut the **live AI matching engine** from the deployed app. In the full product vision,
a coordinator pastes a trial's eligibility rules, the app pulls the patient's scattered
records, and an AI model scores each criterion automatically. I built and proved that
mechanic separately in the demo prototype — but I deliberately left it *out* of this
deployed MVP and instead let users enter and save the per-criterion verdicts themselves.

Why: the rubric's load-bearing requirements are authentication, per-user persistence, a
real create/edit/delete transaction flow, and analytics — none of which depend on the AI
call. Wiring a live model into the deployed app would have added an API key to secure, a
server route to build, latency and failure states to handle, and cost per request, all of
which are deployment risk that buys zero rubric credit. Shipping the data-and-accounts
backbone first is the correct order: it's the part a stranger must be able to clone, run,
and trust. The AI scoring is a known, already-demonstrated layer I can drop in on top of
this exact schema (the `criteria` column already stores the structured verdicts the model
would produce), so cutting it now costs nothing structural and removes the biggest source
of "it broke during grading" risk.

## Checklist
- [ ] **Live URL** — your `https://<app>.vercel.app` (accessible with no credentials; grader signs up themselves)
- [ ] **GitHub repo URL** — public, or grader granted access
- [x] **One-paragraph cut-feature explanation** — above
- [ ] **PostHog screenshot** — after you save at least one run, open PostHog → Activity/Events, confirm `match_run_created` is listed, and screenshot that view
