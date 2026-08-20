# Current Task State

## Completed
- Home "My Current Officials" completeness audit: COMPLETE. `docs/internal_beta_home_current_officials_audit.md`. Root cause found: no data bug, no query bug — the Home "Your districts" chips come from ballot-eligibility-expanded candidate districts (`getCandidatesForDistricts`), not from `user_districts`/representation, creating a misleading side-by-side comparison against the strictly-correct "My Current Officials" section. One genuine, pre-existing, already-tracked data gap remains: no Mayor `current_officials` row exists system-wide yet (source-blocked).
- Shannon Martin candidate-evidence pilot: COMPLETE, end-to-end (commit d6cc50e / 74ea0e6).
- Beta launch priority review complete: `docs/internal_beta_launch_priority_review.md`.

## Current findings
- `user_districts` for `civicmarket.test.01@example.com` (6 rows: City Council D1, School Board D1, County Commission At-Large, FL House D85, FL Senate D27, Mayor) is not stale, duplicate, or conflicting — verified live, read-only.
- `officials_for_user` / `getOfficialsForUser` / `CurrentOfficialsSection` all work exactly as designed (strict district_id join, no board expansion) — no code fix needed there.
- Recommended fix is UI/layout only: reorder Home sections, relabel "Your districts" (it's actually "races you can vote in," not representation), optionally cap `CurrentOfficialsSection` with "View all." Not yet implemented — this session was audit + recommendation only, per task scope.
- Single most important beta blocker (unrelated to this audit): no deploy target/domain exists yet.
- Gemini migration is SMALL scope; should happen before scaling candidate evidence to more candidates.
- Candidate coverage: 21 total candidates live, only Shannon Martin (1) has evidence/candidate_positions/match score — SAFE TO CONTINUE DURING INTERNAL BETA, not a P0 blocker.

## Blockers
- P0: no deploy target/domain; Supabase Auth URL config; real invite-code/email-confirmation verification (all deploy-time, downstream of having a domain).
- P1: Gemini migration; mobile smoke test on 4 auth-gated screens; candidate-evidence coverage scaling.
- Mayor `current_officials` row remains source-blocked (no official source URL yet) — pre-existing, unaffected by this audit.

## Next action
- Home UI fix (reorder + relabel "Your districts" → "Your Representation" / separate ballot-eligible-races labeling) is ready to implement as its own small, isolated session, per `docs/internal_beta_home_current_officials_audit.md` Phase 7, once explicitly requested.
- Otherwise: Milestone 1 of the beta launch plan — choose/provision a real deploy target and domain. Full sequence in `docs/internal_beta_launch_priority_review.md`.
