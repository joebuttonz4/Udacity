# Current Task State

## Completed
- Shannon Martin candidate-evidence pilot: COMPLETE, end-to-end (commit d6cc50e / 74ea0e6).
- Beta launch priority review complete: `docs/internal_beta_launch_priority_review.md`. Reviewed `controlled_psl_beta_readiness.md`, current-state doc, ballot-eligibility/candidate-import work (Package A executed, 21 candidates now live; Package B time-gated to ≤ Aug 26 certification; Package C draft-only), and the Gemini migration scope.

## Current findings
- Single most important blocker: **no deploy target/domain exists yet** — blocks the entire P0 list (Auth URL config, real invite-code/email-confirmation verification).
- Gemini migration is SMALL scope (one isolated ~60-line block in the extraction route); should happen before scaling candidate evidence to more candidates, to avoid duplicate extraction work.
- Candidate coverage: 21 total candidates live, only Shannon Martin (1) has evidence/candidate_positions/match score. Locked-ring design handles this safely — SAFE TO CONTINUE DURING INTERNAL BETA, not a P0 blocker.
- Corrections-mailbox deliverability (previously open item) is already resolved — stale blocker, no longer open.

## Blockers
- P0: no deploy target/domain; Supabase Auth URL config; real invite-code/email-confirmation verification (all deploy-time, downstream of having a domain).
- P1: Gemini migration; mobile smoke test on 4 auth-gated screens; candidate-evidence coverage scaling.

## Next action
- Milestone 1: choose/provision a real deploy target and domain, then complete Supabase Auth URL configuration and one real signup/confirmation verification against it. Full recommended sequence (7 milestones) in `docs/internal_beta_launch_priority_review.md`.
