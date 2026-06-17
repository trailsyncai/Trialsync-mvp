# Submission notes

## The one feature I cut from scope to ship on time — and why

I cut **automatic record ingestion from a live EHR (the SMART-on-FHIR / Epic-Cerner
connection)**. In the full product vision, TrialSync pulls a patient's scattered records
out of the hospital's electronic health record automatically. In this MVP, the user
instead **pastes or uploads** the patient's information and the trial's rules, and the AI
does the matching from there.

Why this is the right cut: the load-bearing, graded parts of the product are the AI
matching itself (the core value), authentication, per-user persistence, the
create/edit/delete flow, and analytics — all of which are fully built and deployed. A live
EHR integration, by contrast, requires hospital credentials, a SMART-on-FHIR OAuth
handshake, and per-vendor data mapping that cannot be stood up or demonstrated without a
real institutional partner. It is months of integration work that adds zero to the thing
being tested here (can the AI read records and rules and return an explainable verdict?),
so deferring it is exactly the scope discipline Chapter 6 calls for. Paste/upload is a
clean stand-in for that data path: the moment a FHIR feed exists, it simply fills the same
text the user pastes today, and nothing downstream changes.

## Checklist
- [ ] **Live URL** — your `https://<app>.vercel.app` (accessible with no credentials; grader signs up themselves)
- [ ] **GitHub repo URL** — public, or grader granted access
- [x] **One-paragraph cut-feature explanation** — above
- [ ] **PostHog screenshot** — after you run + save a match, open PostHog → Activity, confirm `match_run_created` (and `ai_match_run`) appear, and screenshot that view
