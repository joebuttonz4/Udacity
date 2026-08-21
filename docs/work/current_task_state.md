# Current Task State

## Completed
- Deploy target and domain plan: COMPLETE. `docs/internal_beta_deploy_target_domain_plan.md`. Confirmed repo is directly Vercel-deployable with zero code changes (standard Next.js App Router, no middleware, no filesystem/cron assumptions, no hardcoded localhost, no hardcoded auth redirects — Supabase dashboard config drives redirects entirely). Full env-var inventory by name only (no values read): `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` (public), `SUPABASE_SERVICE_ROLE_KEY`/`INVITE_CODE` (server secrets, required for real signup + full onboarding experience), `ANTHROPIC_API_KEY`/`GEMINI_API_KEY` + 2 config vars (server secrets, optional/future — candidate-evidence extraction is hardcoded disabled). Recommended: Vercel, production branch `master`, deploy first to generated `*.vercel.app`, attach custom domain later. Supabase Auth URL plan designed (Site URL + Redirect URLs pattern, keep localhost). Zero BLOCKER-classified risks found; two FOLLOW-UP items (env vars must be set before real signup works; unrelated uncommitted concurrent work not part of this deploy). 11-step interactive deployment sequence documented with explicit stop boundary at env-var-value entry (step 4) and Supabase dashboard credential entry (step 7).
- Home final UX review for controlled beta: COMPLETE, READY (commit `cbb7419`).
- Home Top Matches sorting fix: COMPLETE (commit `11555fa`).
- Home match-score dimension coverage disclosure: COMPLETE (commit `c51e296`).
- Home layout UX improvement: COMPLETE (commit `56ea311`).

## Current findings
- This was planning-only — no Vercel project created, no Supabase Auth URLs changed, no secrets accessed. The next action is entirely the user's: sign into Vercel, import the repo, and provide the 4 required env-var values directly into Vercel's own UI.
- Unrelated concurrent uncommitted work remains in the working tree (`package.json`/`package-lock.json` adding `@google/genai`; untracked `src/lib/candidateEvidence/` + modified `extract-shannon-martin-evidence` route) — not part of this deploy plan, correctly left untouched. Today's `master` (through `cbb7419` plus this task's commit) is fully deployable without that work.
- No `.env.local` values were read or printed at any point in this task — only variable names were identified via source-code search.

## Blockers
- None classified as a hard BLOCKER for deployment itself. FOLLOW-UP: the 4 required env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `INVITE_CODE`) must be entered by the user directly into Vercel before a real signup test can succeed.
- Gemini migration and candidate-evidence coverage scaling remain separate, unrelated in-progress/future work.

## Next action
- User decision: sign into Vercel and begin the import flow (Phase 7, step 1 of the plan doc). Claude stops and waits at step 4 (entering actual env-var values) and step 7 (Supabase dashboard credentials) — those are explicitly the user's own steps.
