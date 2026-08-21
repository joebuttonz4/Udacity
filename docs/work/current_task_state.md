# Current Task State

## Completed
- Home Top Matches sorting fix: COMPLETE. `docs/internal_beta_home_top_matches_sorting.md`. `src/app/page.tsx` now sorts Home's preview list (scored candidates first, by score descending, ties/locked candidates by name ascending, 0 correctly treated as a real score) on a copy of the candidates array — `src/lib/candidates.ts` and `/ballot`'s ordering/grouping are untouched. Helper text updated to "Your strongest available Civic DNA matches." Live-verified: Shannon Martin now ranks #1 on Home showing "66% match" / "Based on 4 Civic DNA dimensions", locked candidates follow alphabetically, `/ballot` ordering confirmed unchanged. Build + lint clean.
- Home UX "not visible" diagnosis: COMPLETE, no code fix was needed that time — root cause was stale dev server/browser; fixed by restarting the dev server (now PID 24744).
- Home match-score dimension coverage disclosure: COMPLETE (commit `c51e296`).
- Home layout UX improvement: COMPLETE (commit `56ea311`).
- Home "My Current Officials" completeness audit: COMPLETE (commit `46b9e93`).

## Current findings
- Home's Top Matches preview is now score-aware; `/ballot`'s per-district candidate ordering intentionally remains alphabetical (unchanged, out of this task's scope) — a future task could consider whether `/ballot` should also surface scored candidates first within each district group, if desired.
- The candidate pool has grown to 33 (concurrent, unrelated Package C1 statewide import work) — unaffected by and irrelevant to this fix beyond being the reason locked alphabetical candidates previously crowded out Shannon Martin.
- Dev server PID 24744 (started during the prior session) is still running and correctly serving the latest code via Turbopack HMR — confirmed by live hard-refresh verification this session.

## Blockers
- P0: no deploy target/domain; Supabase Auth URL config; real invite-code/email-confirmation verification (all deploy-time, downstream of having a domain).
- P1: Gemini migration; mobile smoke test on 4 auth-gated screens; candidate-evidence coverage scaling.
- Mayor `current_officials` row remains source-blocked (no official source URL yet) — unaffected by this session.

## Next action
- Optional follow-up: consider score-aware ordering within `/ballot`'s district groups too, for consistency (not requested yet).
- Otherwise: Milestone 1 of the beta launch plan — choose/provision a real deploy target and domain. Full sequence in `docs/internal_beta_launch_priority_review.md`.
