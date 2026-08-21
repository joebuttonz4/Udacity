# Current Task State

## Completed
- Home match-score dimension coverage disclosure: COMPLETE. `docs/internal_beta_home_match_dimension_disclosure.md`. `src/lib/candidates.ts` (`getCandidatesForDistricts`) now generically computes `dimension_count` (non-null `candidate_positions` fields among the 7 `DIMENSIONS`, scoped only to scored candidates) alongside `match_score`; `src/app/page.tsx` Top Matches renders "Based on N Civic DNA dimensions" under the percentage for scored candidates, nothing extra for locked ones. Verified live for Shannon Martin (count = 4, via network capture + independent read-only re-query). Build + lint clean.
- Home layout UX improvement: COMPLETE (commit `56ea311`). Reordered Home, relabeled sections.
- Home "My Current Officials" completeness audit: COMPLETE (commit `46b9e93`).
- Shannon Martin candidate-evidence pilot: COMPLETE, end-to-end.

## Current findings
- `dimension_count` is also silently available on `/ballot` now (same shared `CandidateWithContext` type/function), but `/ballot`'s JSX was not modified — out of this task's scope. A future task could surface it there too if desired.
- Two separate unrelated concurrent-work diffs are present in the working tree and were left untouched both times they were encountered: `src/lib/ballotEligibility.ts` (self-resolved by its own session between tasks) and `src/app/onboarding/zip/page.tsx` (Package C1 "Florida Statewide" onboarding anchor, still uncommitted as of this task's end).
- No match-score formula, ballot-eligibility logic, or database state was changed by this task.

## Blockers
- P0: no deploy target/domain; Supabase Auth URL config; real invite-code/email-confirmation verification (all deploy-time, downstream of having a domain).
- P1: Gemini migration; mobile smoke test on 4 auth-gated screens; candidate-evidence coverage scaling.
- Mayor `current_officials` row remains source-blocked (no official source URL yet) — unaffected by this session.

## Next action
- Optional follow-up: surface `dimension_count` on `/ballot` as well, for consistency with Home (not requested yet).
- Otherwise: Milestone 1 of the beta launch plan — choose/provision a real deploy target and domain. Full sequence in `docs/internal_beta_launch_priority_review.md`.
