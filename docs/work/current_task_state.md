# Current Task State

## Completed
- Home layout UX improvement: COMPLETE. `docs/internal_beta_home_layout_ux_improvement.md`. Implemented the audit's recommendation: reordered Home (My Current Officials now above ballot-race chips), relabeled "Your districts" → "Your ballot races" with helper text, relabeled "Civic feed" → "CivicMarket status" (content was already beta/status messaging), added explicit locked/scored Top Matches text ("Match score not available yet" / "XX% match"), added "Officials who currently represent you." helper text, tightened row density. Build + lint clean, live-verified against the test account (`civicmarket.test.01@example.com`, via an already-authenticated pre-existing local session — no credentials entered).
- Home "My Current Officials" completeness audit: COMPLETE (commit `46b9e93`). Root cause was a UI labeling issue, not a data/query bug — see `docs/internal_beta_home_current_officials_audit.md`.
- Shannon Martin candidate-evidence pilot: COMPLETE, end-to-end (commit d6cc50e / 74ea0e6).
- Beta launch priority review complete: `docs/internal_beta_launch_priority_review.md`.

## Current findings
- Representation logic, ballot-eligibility logic, and match-score formula are all confirmed unchanged and correct — this session was UI/copy/layout only.
- Deferred UX follow-ups (each needs its own scoped task): (1) "Based on N Civic DNA dimensions" disclosure — needs new logic, dimension count isn't persisted in `match_scores`; (2) Mayor-gap informational state on Home — needs new data passed into `CurrentOfficialsSection` or a new query, and the underlying Mayor `current_officials` row remains source-blocked; (3) "View all X officials" cap — not yet needed at current officials counts.
- `src/lib/ballotEligibility.ts` has an unrelated, pre-existing uncommitted change in the working tree (Package C1 statewide model prep, inert/no live rows) — left untouched, not staged, not part of this task's commits.
- Single most important beta blocker (unrelated to this work): no deploy target/domain exists yet.

## Blockers
- P0: no deploy target/domain; Supabase Auth URL config; real invite-code/email-confirmation verification (all deploy-time, downstream of having a domain).
- P1: Gemini migration; mobile smoke test on 4 auth-gated screens; candidate-evidence coverage scaling.
- Mayor `current_officials` row remains source-blocked (no official source URL yet) — unaffected by this session.

## Next action
- If continuing UX work: implement one of the three deferred follow-ups above as its own scoped session, or leave as-is.
- Otherwise: Milestone 1 of the beta launch plan — choose/provision a real deploy target and domain. Full sequence in `docs/internal_beta_launch_priority_review.md`.
